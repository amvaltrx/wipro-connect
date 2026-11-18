import {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from 'discord.js';
import { config } from './utils/config.js';
import { storage } from './utils/storage.js';
import { whatsappManager } from './utils/whatsappManager.js';
import { embeds } from './utils/embeds.js';

import infoCmd from './commands/info.js';
import pingCmd from './commands/ping.js';
import closeCmd from './commands/close.js';
import whatsappCmd from './commands/whatsapp.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = new Collection();
client.commands.set(infoCmd.data.name, infoCmd);
client.commands.set(pingCmd.data.name, pingCmd);
client.commands.set(closeCmd.data.name, closeCmd);
client.commands.set(whatsappCmd.data.name, whatsappCmd);

// Ready event
client.once('ready', () => {
  console.log(`[BOT READY] Logged in as ${client.user.tag} (ID: ${client.user.id})`);
  client.user.setActivity('WhatsApp Gateway | /whatsapp');
});

// Interaction Event
client.on('interactionCreate', async (interaction) => {
  // 1. Slash Commands
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(`Error executing ${interaction.commandName}:`, err);
      const replyFn = interaction.replied || interaction.deferred ? 'editReply' : 'reply';
      await interaction[replyFn]({
        content: `❌ Command execution failed: ${err.message}`,
        ephemeral: true,
      });
    }
    return;
  }

  // 2. Button Interactions
  if (interaction.isButton()) {
    const userId = interaction.user.id;

    // A. Open Private WhatsApp Terminal Button
    if (interaction.customId === 'btn_open_wa_terminal') {
      const existing = storage.getTerminalByUser(userId);
      if (existing) {
        return interaction.reply({
          content: `ℹ️ You already have an active WhatsApp terminal: <#${existing.threadId}>`,
          ephemeral: true,
        });
      }

      await interaction.deferReply({ ephemeral: true });

      try {
        const thread = await interaction.channel.threads.create({
          name: `terminal-${interaction.user.username}`,
          type: ChannelType.PrivateThread,
          reason: 'Encrypted WhatsApp Terminal Workspace',
        });

        await thread.members.add(userId);
        storage.setTerminal(userId, thread.id, interaction.channel.id);

        await interaction.editReply({
          content: `✅ **Private WhatsApp Terminal Created!** Jump to your workspace: <#${thread.id}>`,
        });

        // Prompt login directly inside thread
        await thread.send({
          content: `👋 **Welcome <@${userId}>!** Initializing your private WhatsApp socket gateway...\nRun \`/whatsapp login\` with your phone number to use an 8-digit pairing code, or scan the QR code below.`,
        });

        await whatsappManager.startSession(userId, thread, client);
      } catch (err) {
        return interaction.editReply(`❌ Failed to create terminal thread: ${err.message}`);
      }
      return;
    }

    // B. Send Message Modal Button
    if (interaction.customId === 'btn_send_modal') {
      const modal = new ModalBuilder()
        .setCustomId('modal_send_whatsapp')
        .setTitle('📤 Send WhatsApp Message');

      const toInput = new TextInputBuilder()
        .setCustomId('input_to')
        .setLabel('Recipient (Phone number or Group JID)')
        .setPlaceholder('+91 98765 43210 or 120363024859345678@g.us')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const msgInput = new TextInputBuilder()
        .setCustomId('input_msg')
        .setLabel('Message')
        .setPlaceholder('Type your message to send on WhatsApp...')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(toInput),
        new ActionRowBuilder().addComponents(msgInput)
      );

      return interaction.showModal(modal);
    }

    // C. Ephemeral Status Button
    if (interaction.customId === 'btn_status') {
      const stats = whatsappManager.getStatus(userId);
      const embed = embeds.statusCard(stats.status, stats.phone, stats.uptime);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // D. Disconnect / Logout Button
    if (interaction.customId === 'btn_disconnect') {
      await whatsappManager.logout(userId, client);
      return interaction.reply({
        content: '🔴 **Successfully disconnected and logged out of WhatsApp.**',
        ephemeral: true,
      });
    }
  }

  // 3. Modal Submissions
  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'modal_send_whatsapp') {
      const to = interaction.fields.getTextInputValue('input_to');
      const text = interaction.fields.getTextInputValue('input_msg');
      const userId = interaction.user.id;

      await interaction.deferReply({ ephemeral: false });

      try {
        const sent = await whatsappManager.sendMessage(userId, to, text);
        const embed = embeds.outgoingMessage(to, text, sent.messageId);
        const discordReply = await interaction.editReply({ embeds: [embed] });

        storage.saveMessageRef(discordReply.id, {
          waMessageId: sent.messageId,
          waJid: sent.jid,
          sender: 'You',
        });
      } catch (err) {
        return interaction.editReply(`❌ Failed to send WhatsApp message: ${err.message}`);
      }
    }
  }
});

// Message Handling (Native Reply & Threat / Privacy Defense)
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Only act inside Threads
  if (!message.channel.isThread()) return;

  const threadOwnerId = storage.getUserByThread(message.channel.id);
  if (!threadOwnerId) return;

  // Security: Auto-purge foreign users typing in another user's private terminal
  if (message.author.id !== threadOwnerId && !message.member?.permissions.has('ManageThreads')) {
    try {
      await message.delete();
      const warnMsg = await message.channel.send({
        content: `⛔ <@${message.author.id}>, this is a private WhatsApp terminal. Messages from unauthorized users are auto-purged.`,
      });
      setTimeout(() => warnMsg.delete().catch(() => {}), 4000);
    } catch (e) {}
    return;
  }

  // Native Discord Reply (↩️) to customer chat forwarding
  if (message.reference && message.reference.messageId) {
    const ref = storage.getMessageRef(message.reference.messageId);
    if (ref && ref.waJid) {
      try {
        await whatsappManager.sendMessage(threadOwnerId, ref.waJid, message.content);
        await message.react('✅');
      } catch (err) {
        await message.reply(`❌ Failed to deliver reply to WhatsApp: ${err.message}`);
      }
    }
  }
});

// Start Discord Bot
client.login(config.token).catch((err) => {
  console.error('[LOGIN ERROR] Failed to login to Discord:', err);
});
