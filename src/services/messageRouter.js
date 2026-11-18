import { embeds } from '../ui/embeds.js';
import { storage } from '../utils/storage.js';
import { toWhatsAppJid } from '../utils/formatters.js';
import { logger } from '../utils/logger.js';

export const messageRouter = {
  // Listen for incoming WhatsApp messages and pipe into Discord thread
  setupInboundListener(sock, userId, thread) {
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const msg of messages) {
        // Skip status broadcasts or outgoing self messages
        if (!msg.message || msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') continue;

        const senderJid = msg.key.remoteJid;
        const alias = storage.getContactAlias(userId, senderJid);
        const senderName = alias || msg.pushName || senderJid.split('@')[0];

        // Extract message text across different message types
        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          msg.message.imageMessage?.caption ||
          msg.message.videoMessage?.caption ||
          '';

        logger.wa(`Inbound message from ${senderName} (${senderJid})`);

        try {
          const embed = embeds.incomingMessage(senderName, senderJid, text, msg.key.id);
          const sentMsg = await thread.send({ embeds: [embed] });

          // Map Discord msg ID -> WhatsApp details so native replies work
          storage.saveMessageRef(sentMsg.id, {
            waMessageId: msg.key.id,
            waJid: senderJid,
            sender: senderName,
          });
        } catch (err) {
          logger.error('Failed to post inbound message to thread:', err.message);
        }
      }
    });
  },

  // Send message to WhatsApp contact or group
  async send(sock, to, text) {
    const jid = toWhatsAppJid(to);
    if (!jid) {
      throw new Error('Invalid phone number or recipient JID');
    }

    logger.wa(`Sending outbound message to: ${jid}`);
    const result = await sock.sendMessage(jid, { text });

    return {
      messageId: result.key.id,
      jid,
      timestamp: result.messageTimestamp,
    };
  },

  // Revoke / delete message for everyone
  async delete(sock, to, messageId) {
    const jid = toWhatsAppJid(to);
    if (!jid) {
      throw new Error('Invalid recipient JID');
    }

    logger.wa(`Revoking message ${messageId} in: ${jid}`);
    await sock.sendMessage(jid, {
      delete: {
        remoteJid: jid,
        fromMe: true,
        id: messageId,
      },
    });

    return true;
  },
};
