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
import { storage } from './storage.js';
import { embeds } from './embeds.js';
import { config } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SESSIONS_DIR = path.join(__dirname, '..', 'sessions');

if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

// Active in-memory WhatsApp sockets per Discord user: userId -> { sock, startTime, status, userJid, phone }
const activeSessions = new Map();

export const whatsappManager = {
  activeSessions,

  normalizeJid(input) {
    if (!input) return null;
    let clean = input.trim().replace(/[\s\-\(\)]/g, '');
    if (clean.endsWith('@s.whatsapp.net') || clean.endsWith('@g.us')) {
      return clean;
    }
    if (clean.startsWith('+')) {
      clean = clean.substring(1);
    }
    return `${clean}@s.whatsapp.net`;
  },

  async startSession(userId, thread, discordClient, options = {}) {
    const sessionPath = path.join(SESSIONS_DIR, `user_${userId}`);
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const logger = pino({ level: 'silent' });

    const sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: false,
      auth: state,
      browser: ['Wipro Connect', 'Chrome', '1.0.0'],
    });

    const sessionData = {
      sock,
      startTime: Date.now(),
      status: 'Connecting',
      userJid: null,
      phone: options.phone || null,
      threadId: thread.id,
    };
    activeSessions.set(userId, sessionData);

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // Handle QR Code login
      if (qr && !options.phone) {
        try {
          const qrBuffer = await qrcode.toBuffer(qr, { width: 350, margin: 2 });
          const attachment = new AttachmentBuilder(qrBuffer, { name: 'whatsapp-login-qr.png' });
          await thread.send({
            content: '🔑 **Scan this QR Code in WhatsApp on your phone:**\n*(WhatsApp > Settings > Linked Devices > Link a Device)*',
            files: [attachment],
          });
        } catch (qrErr) {
          console.error('Failed to generate QR buffer:', qrErr);
        }
      }

      // Handle 8-digit Pairing Code
      if (qr && options.phone && !sock.authState.creds.registered) {
        try {
          const cleanPhone = options.phone.replace(/[^0-9]/g, '');
          const code = await sock.requestPairingCode(cleanPhone);
          const formattedCode = code?.match(/.{1,4}/g)?.join(' - ') || code;
          await thread.send({
            content: `🔑 **Your WhatsApp 8-digit Pairing Code:**\n# \`${formattedCode}\`\n\n*(Open WhatsApp > Linked Devices > Link with phone number instead > Enter this code)*`,
          });
        } catch (codeErr) {
          await thread.send(`⚠️ Failed to generate pairing code: ${codeErr.message}`);
        }
      }

      if (connection === 'open') {
        sessionData.status = 'Online';
        sessionData.userJid = sock.user?.id || null;
        const phone = sock.user?.id ? sock.user.id.split(':')[0] : 'Linked Device';
        sessionData.phone = phone;

        await thread.send({
          content: `✅ **WhatsApp Connected Successfully!** (Account: \`+${phone}\`)`,
        });

        // Send full command guide and interactive buttons
        await thread.send(embeds.helpGuide());

        // Audit log in server logs channel
        if (config.logsChannelId && discordClient) {
          try {
            const logsChannel = await discordClient.channels.fetch(config.logsChannelId).catch(() => null);
            if (logsChannel) {
              await logsChannel.send(`🔒 **Session Activated:** <@${userId}> started an encrypted WhatsApp session in a private terminal.`);
            }
          } catch (e) {
            console.error('Failed to send audit log:', e);
          }
        }
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        sessionData.status = 'Disconnected';

        if (statusCode === DisconnectReason.loggedOut) {
          await thread.send('🔴 **WhatsApp Session Logged Out / Unlinked.** Auth keys have been purged.');
          whatsappManager.logout(userId, discordClient);
        } else if (shouldReconnect) {
          await thread.send('🔄 *Reconnecting to WhatsApp gateway...*');
          whatsappManager.startSession(userId, thread, discordClient, options);
        }
      }
    });

    // Inbound Message Listener (WhatsApp -> Discord Thread)
    sock.ev.on('messages.upsert', async ({ messages: newMsgs, type }) => {
      if (type !== 'notify') return;

      for (const msg of newMsgs) {
        if (!msg.message || msg.key.fromMe) continue;

        const senderJid = msg.key.remoteJid;
        const senderName = msg.pushName || storage.getContactAlias(userId, senderJid) || senderJid.split('@')[0];
        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          msg.message.imageMessage?.caption ||
          msg.message.videoMessage?.caption ||
          '';

        const embed = embeds.incomingMessage(senderName, senderJid, text, msg.key.id);
        const sentDiscordMsg = await thread.send({ embeds: [embed] });

        // Map Discord message ID -> WhatsApp Message ID & JID for native reply
        storage.saveMessageRef(sentDiscordMsg.id, {
          waMessageId: msg.key.id,
          waJid: senderJid,
          sender: senderName,
        });
      }
    });

    return sessionData;
  },

  async sendMessage(userId, to, text) {
    const session = activeSessions.get(userId);
    if (!session || session.status !== 'Online') {
      throw new Error('Your WhatsApp terminal is not online. Please run `/wa login`.');
    }

    const jid = this.normalizeJid(to);
    if (!jid) throw new Error('Invalid recipient phone number or WhatsApp JID.');

    const result = await session.sock.sendMessage(jid, { text });
    return {
      messageId: result.key.id,
      jid,
      timestamp: result.messageTimestamp,
    };
  },

  async deleteMessage(userId, to, messageId) {
    const session = activeSessions.get(userId);
    if (!session || session.status !== 'Online') {
      throw new Error('Your WhatsApp terminal is not online.');
    }

    const jid = this.normalizeJid(to);
    if (!jid) throw new Error('Invalid recipient JID.');

    await session.sock.sendMessage(jid, {
      delete: {
        remoteJid: jid,
        fromMe: true,
        id: messageId,
      },
    });

    return true;
  },

  getStatus(userId) {
    const session = activeSessions.get(userId);
    if (!session) {
      return { status: 'Offline', phone: null, uptime: '0m' };
    }

    const diffMinutes = Math.floor((Date.now() - session.startTime) / 60000);
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    const uptimeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    return {
      status: session.status,
      phone: session.phone,
      uptime: uptimeStr,
    };
  },

  async logout(userId, discordClient = null) {
    const session = activeSessions.get(userId);
    if (session) {
      try {
        await session.sock.logout();
      } catch (e) {
        // ignore if already disconnected
      }
      activeSessions.delete(userId);
    }

    // Delete session files on disk
    const sessionPath = path.join(SESSIONS_DIR, `user_${userId}`);
    if (fs.existsSync(sessionPath)) {
      try {
        fs.rmSync(sessionPath, { recursive: true, force: true });
      } catch (err) {
        console.error('Failed to purge session files:', err);
      }
    }

    if (config.logsChannelId && discordClient) {
      try {
        const logsChannel = await discordClient.channels.fetch(config.logsChannelId).catch(() => null);
        if (logsChannel) {
          await logsChannel.send(`🔴 **Session Ended:** <@${userId}> logged out of WhatsApp.`);
        }
      } catch (e) {}
    }
  },
};
