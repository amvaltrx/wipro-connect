import {
  default as makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AttachmentBuilder } from 'discord.js';

import { logger } from '../utils/logger.js';
import { formatUptime, cleanPhoneNumber } from '../utils/formatters.js';
import { embeds } from '../ui/embeds.js';
import { buttons } from '../ui/buttons.js';
import { config } from '../config.js';
import { messageRouter } from './messageRouter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SESSIONS_DIR = path.join(__dirname, '..', '..', 'sessions');

if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

// In-memory active sockets: userId -> { sock, startTime, status, phone, threadId }
const activeSessions = new Map();

export const sessionManager = {
  activeSessions,

  hasActiveSession(userId) {
    const s = activeSessions.get(userId);
    return s && s.status === 'Online';
  },

  getSession(userId) {
    return activeSessions.get(userId) || null;
  },

  async start(userId, thread, discordClient, { phone = null } = {}) {
    const sessionPath = path.join(SESSIONS_DIR, `user_${userId}`);
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }

    logger.wa(`Initializing socket session for user ${userId}...`);

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    logger.wa(`Using Baileys version v${version.join('.')}, isLatest: ${isLatest}`);

    const sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }), // Suppress internal noise
      printQRInTerminal: false,
      auth: state,
      browser: ['Wipro Connect', 'Chrome', '124.0.0.0'],
      syncFullHistory: false, // Keep memory footprint light
    });

    const sessionData = {
      sock,
      startTime: Date.now(),
      status: 'Connecting',
      phone: phone || null,
      threadId: thread.id,
    };
    activeSessions.set(userId, sessionData);

    sock.ev.on('creds.update', saveCreds);

    // Connection lifecycle
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // 1. QR Code flow
      if (qr && !phone) {
        try {
          logger.wa(`Generating QR code attachment for user ${userId}`);
          const qrBuffer = await qrcode.toBuffer(qr, { width: 320, margin: 2 });
          const attachment = new AttachmentBuilder(qrBuffer, { name: 'whatsapp-login.png' });

          await thread.send({
            content: '📸 **Scan this QR Code in WhatsApp:**\n*(Settings > Linked Devices > Link a Device)*',
            files: [attachment],
          });
        } catch (err) {
          logger.error('Failed to generate QR buffer:', err);
        }
      }

      // 2. 8-digit Pairing Code flow (no QR needed)
      if (qr && phone && !sock.authState.creds.registered) {
        try {
          const clean = cleanPhoneNumber(phone);
          logger.wa(`Requesting 8-digit pairing code for: ${clean}`);
          const code = await sock.requestPairingCode(clean);
          const formatted = code?.match(/.{1,4}/g)?.join(' - ') || code;

          await thread.send({
            content: `🔑 **Your WhatsApp Pairing Code:**\n# \`${formatted}\`\n*(Settings > Linked Devices > Link with phone number instead)*`,
          });
        } catch (err) {
          logger.error('Pairing code request failed:', err.message);
          await thread.send(`⚠️ Could not generate pairing code: \`${err.message}\``);
        }
      }

      // 3. Connected
      if (connection === 'open') {
        sessionData.status = 'Online';
        const rawJid = sock.user?.id || '';
        const userPhone = rawJid.split(':')[0] || 'Unknown';
        sessionData.phone = userPhone;

        logger.wa(`Socket connected! User phone: ${userPhone}`);

        await thread.send({
          content: `✅ **WhatsApp Connected!** Linked account: \`+${userPhone}\``,
        });

        // Present command guide and action buttons
        await thread.send({
          embeds: [embeds.helpGuide()],
          components: [buttons.terminalControls()],
        });

        // Broadcast to logs channel
        if (config.channels.logs && discordClient) {
          try {
            const logsChan = await discordClient.channels.fetch(config.channels.logs).catch(() => null);
            if (logsChan) {
              await logsChan.send(`🔒 **Session Activated:** <@${userId}> linked WhatsApp terminal.`);
            }
          } catch (e) {}
        }
      }

      // 4. Closed / Reconnecting
      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;

        logger.warn(`Connection closed. StatusCode: ${statusCode}, LoggedOut: ${loggedOut}`);
        sessionData.status = 'Disconnected';

        if (loggedOut) {
          await thread.send('🔴 **WhatsApp session was logged out from the phone.** Auth keys purged.');
          sessionManager.logout(userId, discordClient);
        } else {
          // Normal reconnect on socket drop
          await thread.send('🔄 *Connection lost. Reconnecting to WhatsApp gateway...*');
          sessionManager.start(userId, thread, discordClient, { phone });
        }
      }
    });

    // Inbound messages
    messageRouter.setupInboundListener(sock, userId, thread);

    return sessionData;
  },

  async logout(userId, discordClient = null) {
    const session = activeSessions.get(userId);
    if (session) {
      try {
        await session.sock.logout();
      } catch (e) {
        // Safe to ignore if already dead socket
      }
      activeSessions.delete(userId);
    }

    // Clean auth directory
    const sessionPath = path.join(SESSIONS_DIR, `user_${userId}`);
    if (fs.existsSync(sessionPath)) {
      try {
        fs.rmSync(sessionPath, { recursive: true, force: true });
        logger.info(`Purged session folder for user ${userId}`);
      } catch (err) {
        logger.error(`Error purging session: ${err.message}`);
      }
    }

    if (config.channels.logs && discordClient) {
      try {
        const logsChan = await discordClient.channels.fetch(config.channels.logs).catch(() => null);
        if (logsChan) {
          await logsChan.send(`🔴 **Session Ended:** <@${userId}> disconnected their WhatsApp session.`);
        }
      } catch (e) {}
    }
  },

  getStatus(userId) {
    const session = activeSessions.get(userId);
    if (!session) {
      return { status: 'Offline', phone: null, uptime: '0m' };
    }

    return {
      status: session.status,
      phone: session.phone,
      uptime: formatUptime(session.startTime),
    };
  },
};
