import { storage } from '../utils/storage.js';
import { sessionManager } from '../services/sessionManager.js';
import { messageRouter } from '../services/messageRouter.js';
import { logger } from '../utils/logger.js';

export async function handleMessage(message) {
  if (message.author.bot) return;

  // Terminal logic applies only inside Discord Threads
  if (!message.channel.isThread()) return;

  const threadOwnerId = storage.getUserByThread(message.channel.id);
  if (!threadOwnerId) return;

  // 1. Intrusion Defense: Delete messages from unauthorized users typing inside someone's private terminal
  if (message.author.id !== threadOwnerId && !message.member?.permissions.has('ManageThreads')) {
    try {
      await message.delete();
      const warn = await message.channel.send(
        `⛔ <@${message.author.id}>, this is a private WhatsApp workspace. Unauthorized messages are auto-purged.`
      );
      setTimeout(() => warn.delete().catch(() => {}), 4000);
    } catch (e) {}
    return;
  }

  // 2. Native Discord In-Thread Reply (↩️) to WhatsApp
  if (message.reference && message.reference.messageId) {
    const ref = storage.getMessageRef(message.reference.messageId);
    if (ref && ref.waJid) {
      const session = sessionManager.getSession(threadOwnerId);
      if (!session || session.status !== 'Online') {
        return message.reply('⚠️ Cannot forward reply: Your WhatsApp terminal is currently offline.');
      }

      try {
        await messageRouter.send(session.sock, ref.waJid, message.content);
        await message.react('✅');
        logger.wa(`Forwarded native reply from user ${threadOwnerId} to ${ref.waJid}`);
      } catch (err) {
        logger.error('Failed to forward native reply:', err.message);
        await message.reply(`❌ Failed to send reply to WhatsApp: ${err.message}`);
      }
    }
  }
}
