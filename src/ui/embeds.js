import { EmbedBuilder } from 'discord.js';
import { maskPhoneNumber } from '../utils/formatters.js';

export const embeds = {
  // Public Hub Login Card
  loginHub() {
    return new EmbedBuilder()
      .setColor(0x25D366) // Official WhatsApp Green
      .setTitle('📲 Wipro Connect — WhatsApp Terminal Hub')
      .setDescription(
        'Click the button below to initialize your personal, encrypted **WhatsApp Terminal**.\n\n' +
        '🔒 **Super-Private Thread:** Clicking the button opens an isolated workspace visible **only to you**.\n' +
        '🔑 **Instant QR Login:** Scan the QR code or link via phone number inside your private thread.\n' +
        '💬 **Full Control:** Send, reply to, and delete WhatsApp chats without leaving Discord.'
      )
      .setFooter({ text: 'Enterprise WhatsApp Gateway • End-to-End Encrypted' })
      .setTimestamp();
  },

  // In-terminal guide
  helpGuide() {
    return new EmbedBuilder()
      .setColor(0x00A884)
      .setTitle('📖 WhatsApp Terminal — Complete Command Reference & User Guide')
      .setDescription(
        'Welcome to your encrypted WhatsApp workspace! Below is your reference guide for commands and interaction options.\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '### 📤 1. Sending Messages\n' +
        '• **Command:** `/whatsapp send to:<number/group> message:<text>`\n' +
        '• **One-Click UI:** Click the **`[ 📤 Send Message ]`** button below to open a quick modal.\n' +
        '• **Recipient formats:**\n' +
        '  - Direct phone: `+91 98765 43210` or `15551234567`\n' +
        '  - Group JID: `120363024859345678@g.us`\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '### 💬 2. Replying to Incoming Chats\n' +
        '• When customers or contacts message you, their chat appears here in an embed card.\n' +
        '• **To Reply:** Hover or tap the forwarded message, click Discord\'s native **Reply (↩️)**, and type your text.\n' +
        '• The bot pipes your response straight to WhatsApp and marks the message with a `✅`.\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '### 🗑️ 3. Revoking Messages ("Delete for Everyone")\n' +
        '• **Command:** `/whatsapp delete message_id:<id>`\n' +
        '• Revokes the message on WhatsApp for everyone.\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '### 📊 4. Status & Disconnect\n' +
        '• `/whatsapp status` — Ephemeral view of your session and uptime.\n' +
        '• `/whatsapp logout` — Terminate socket and wipe keys from disk.'
      )
      .setFooter({ text: 'Wipro Connect • Secure Terminal Session' });
  },

  incomingMessage(senderName, phoneOrJid, text, messageId) {
    return new EmbedBuilder()
      .setColor(0x00D26A)
      .setAuthor({ name: `WhatsApp Inbound • ${senderName || 'Contact'}` })
      .setTitle(`💬 Message from ${senderName || phoneOrJid}`)
      .setDescription(text || '*[Non-text media or file attachment]*')
      .addFields(
        { name: '📞 Sender', value: `\`${maskPhoneNumber(phoneOrJid)}\``, inline: true },
        { name: '🆔 Message ID', value: `\`${messageId}\``, inline: true }
      )
      .setFooter({ text: '💡 Tap Discord Reply (↩️) to answer this contact directly' })
      .setTimestamp();
  },

  outgoingMessage(to, text, messageId) {
    return new EmbedBuilder()
      .setColor(0x34B7F1)
      .setAuthor({ name: 'WhatsApp Outbound • Delivered' })
      .setDescription(text)
      .addFields(
        { name: '📨 Delivered To', value: `\`${to}\``, inline: true },
        { name: '🆔 WhatsApp Message ID', value: `\`${messageId}\``, inline: true }
      )
      .setFooter({ text: '✅ Sent via Wipro Connect Gateway' })
      .setTimestamp();
  },

  statusCard(status, phone, uptimeStr) {
    const isOnline = status === 'Online';
    return new EmbedBuilder()
      .setColor(isOnline ? 0x25D366 : 0xED4245)
      .setTitle('📊 WhatsApp Terminal Status')
      .addFields(
        { name: '🔌 Connection', value: isOnline ? '🟢 **Online**' : '🔴 **Offline**', inline: true },
        { name: '📱 Account', value: phone ? `\`${maskPhoneNumber(phone)}\`` : '*Not Linked*', inline: true },
        { name: '⏱️ Session Uptime', value: uptimeStr || '0m', inline: true }
      )
      .setFooter({ text: 'Wipro Connect • Terminal Session Metrics' })
      .setTimestamp();
  },
};
