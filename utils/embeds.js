import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const embeds = {
  // Public Hub Login Card
  loginHub() {
    const embed = new EmbedBuilder()
      .setColor(0x25D366) // WhatsApp Green
      .setTitle('📲 Wipro Connect — WhatsApp Terminal Hub')
      .setDescription(
        'Click the button below to initialize your personal, encrypted **WhatsApp Terminal**.\n\n' +
        '🔒 **Super-Private Thread:** Clicking the button will open a private workspace visible **only to you**.\n' +
        '🔑 **Instant QR Login:** Scan your WhatsApp QR code inside your private thread to link your account.\n' +
        '💬 **Full Control:** Send, reply to, and delete WhatsApp messages directly inside your private thread.'
      )
      .setFooter({ text: 'Enterprise WhatsApp Gateway • End-to-End Encrypted' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_open_wa_terminal')
        .setLabel('🔑 Login to WhatsApp')
        .setStyle(ButtonStyle.Success)
    );

    return { embeds: [embed], components: [row] };
  },

  // Documentation & Command Guide inside Terminal
  helpGuide() {
    const embed = new EmbedBuilder()
      .setColor(0x00A884)
      .setTitle('📖 WhatsApp Terminal — Complete Command Reference & User Guide')
      .setDescription(
        'Welcome to your encrypted WhatsApp workspace! Below is the complete reference guide for all commands, formats, and actions.\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '### 📤 1. Sending WhatsApp Messages\n' +
        '• **Slash Command:**\n' +
        '  `/wa send to:<recipient> message:<text>`\n' +
        '• **One-Click UI:**\n' +
        '  Click the **`[ 📤 Send Message ]`** button below to open a quick modal popup.\n' +
        '• **Recipient Formats:**\n' +
        '  - Phone Number: `+91 98765 43210` or `15551234567` *(spaces, dashes, and + are auto-formatted)*\n' +
        '  - WhatsApp Group: `120363024859345678@g.us`\n' +
        '• **Examples:**\n' +
        '  - `/wa send to:+919876543210 message:Hello! Your order has been dispatched.`\n' +
        '  - `/wa send to:120363024859345678@g.us message:Team update: Meeting at 3 PM`\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '### 💬 2. Replying to Incoming Customer Chats\n' +
        '• Incoming messages from customers appear directly in this private thread:\n' +
        '  *Example:* `💬 From: John Doe (+••••••4321): Is this product in stock?`\n' +
        '• **How to Reply:**\n' +
        '  1. Hover or tap the forwarded customer message.\n' +
        '  2. Click Discord\'s **Reply (↩️)** button.\n' +
        '  3. Type your response and press Enter.\n' +
        '• The bot automatically pipes your text back to that customer on WhatsApp and reacts with `✅`.\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '### 🗑️ 3. Revoking / Deleting Messages ("Delete for Everyone")\n' +
        '• **Slash Command:**\n' +
        '  `/wa delete to:<recipient> message_id:<id>`\n' +
        '• When you send a message, the bot gives you its unique WhatsApp Message ID.\n' +
        '• Use this command to revoke that message on WhatsApp for everyone.\n' +
        '  *Example:* `/wa delete to:+919876543210 message_id:3EB0ABC12345`\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '### 📊 4. Checking Terminal Status\n' +
        '• **Slash Command:** `/wa status`\n' +
        '• **Button:** Click **`[ 📊 Status ]`**\n' +
        '• Displays connection state (`Online`), masked account identifier, and session uptime.\n' +
        '• All status displays are **ephemeral** (visible strictly to your eyes only).\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '### 🔴 5. Disconnecting & Logging Out\n' +
        '• **Slash Command:** `/wa logout`\n' +
        '• **Button:** Click **`[ 🔴 Disconnect ]`**\n' +
        '• Unlinks your WhatsApp device, terminates the background socket, and wipes your authentication keys from the server.\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '### 🛡️ 6. Privacy & Security Rules\n' +
        '• **Strict Ownership:** Only you can type, reply, or run commands in this thread.\n' +
        '• **Auto-Purge:** If any unauthorized member attempts to type here, their message is blocked and deleted.\n' +
        '• **Zero Broadcast:** Your phone number and private customer chats are never sent to public server channels.'
      )
      .setFooter({ text: 'Wipro Connect • Secure Terminal Session' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_send_modal')
        .setLabel('📤 Send Message')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('btn_status')
        .setLabel('📊 Status')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('btn_disconnect')
        .setLabel('🔴 Disconnect')
        .setStyle(ButtonStyle.Danger)
    );

    return { embeds: [embed], components: [row] };
  },

  // Incoming WhatsApp message forwarded to Discord
  incomingMessage(senderName, phoneOrJid, text, messageId) {
    return new EmbedBuilder()
      .setColor(0x00D26A)
      .setAuthor({ name: `WhatsApp Inbound • ${senderName || 'Contact'}` })
      .setTitle(`💬 New Message from ${senderName || phoneOrJid}`)
      .setDescription(text || '*[Non-text media attachment]*')
      .addFields(
        { name: '📞 Phone / JID', value: `\`${phoneOrJid}\``, inline: true },
        { name: '🆔 Message ID', value: `\`${messageId}\``, inline: true }
      )
      .setFooter({ text: '💡 Hover & click Discord Reply (↩️) to respond to this customer instantly' })
      .setTimestamp();
  },

  // Outgoing Message Confirmation
  outgoingMessage(to, text, messageId) {
    return new EmbedBuilder()
      .setColor(0x34B7F1)
      .setAuthor({ name: 'WhatsApp Outbound • Delivered' })
      .setDescription(text)
      .addFields(
        { name: '📨 Delivered To', value: `\`${to}\``, inline: true },
        { name: '🆔 WhatsApp Message ID', value: `\`${messageId}\``, inline: true }
      )
      .setFooter({ text: '✅ Message sent through WhatsApp gateway' })
      .setTimestamp();
  },

  // Status Card
  statusCard(status, phone, uptimeStr) {
    return new EmbedBuilder()
      .setColor(status === 'Online' ? 0x25D366 : 0xED4245)
      .setTitle('📊 WhatsApp Terminal Status')
      .addFields(
        { name: '🔌 Connection State', value: `**${status}**`, inline: true },
        { name: '📱 Linked Account', value: phone ? `\`${phone}\`` : '*Not Linked*', inline: true },
        { name: '⏱️ Session Uptime', value: uptimeStr || '0m', inline: true }
      )
      .setFooter({ text: 'Wipro Connect • Secure Terminal Metrics' })
      .setTimestamp();
  },
};
