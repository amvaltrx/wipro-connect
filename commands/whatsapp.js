import {
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import { whatsappManager } from '../utils/whatsappManager.js';
import { storage } from '../utils/storage.js';
import { embeds } from '../utils/embeds.js';
import { config } from '../utils/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('whatsapp')
    .setDescription('WhatsApp terminal controls and commands')
    .addSubcommand((sub) =>
      sub
        .setName('login')
        .setDescription('Start WhatsApp login with QR code or direct 8-digit pairing code')
        .addStringOption((opt) =>
          opt
            .setName('phone')
            .setDescription('Optional phone number with country code to link via 8-digit code (e.g. 919876543210)')
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('send')
        .setDescription('Send a WhatsApp message to a contact, phone number, or group')
        .addStringOption((opt) =>
          opt
            .setName('to')
            .setDescription('Recipient contact name, group, or phone number')
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName('message')
            .setDescription('Message text to deliver')
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('contacts')
        .setDescription('View WhatsApp contacts and aliases')
        .addStringOption((opt) =>
          opt
            .setName('query')
            .setDescription('Optional name or phone number filter')
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('search')
        .setDescription('Search WhatsApp contacts and groups by name, number, or message')
        .addStringOption((opt) =>
          opt
            .setName('query')
            .setDescription('Name, nickname, phone number, or message keyword')
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('name')
        .setDescription('Assign or update a custom contact name/nickname')
        .addStringOption((opt) =>
          opt
            .setName('to')
            .setDescription('Recipient contact, phone number, or existing nickname')
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName('name')
            .setDescription('New friendly name or nickname for this contact')
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('delete')
        .setDescription('Revoke / delete a sent WhatsApp message for everyone')
        .addStringOption((opt) =>
          opt
            .setName('message_id')
            .setDescription('WhatsApp Message ID to revoke')
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName('to')
            .setDescription('Optional recipient contact, group, or phone (auto-detected if omitted)')
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('status')
        .setDescription('Check your current WhatsApp terminal status')
    )
    .addSubcommand((sub) =>
      sub
        .setName('logout')
        .setDescription('Disconnect and unlink your WhatsApp account')
    )
    .addSubcommand((sub) =>
      sub
        .setName('close')
        .setDescription('Close and permanently delete this private WhatsApp terminal thread')
    )
    .addSubcommand((sub) =>
      sub
        .setName('setup')
        .setDescription('Provision WhatsApp Control Center in this server (Admin only)')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    // 1. SETUP (Admin only)
    if (sub === 'setup') {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          content: '⛔ Administrator permission required to run setup.',
          ephemeral: true,
        });
      }

      await interaction.deferReply({ ephemeral: true });
      const guild = interaction.guild;

      try {
        // Create Category
        const category = await guild.channels.create({
          name: '⚙️ WHATSAPP CONTROL CENTER',
          type: ChannelType.GuildCategory,
        });

        // Create Channels
        const loginChannel = await guild.channels.create({
          name: '📲-whatsapp-login',
          type: ChannelType.GuildText,
          parent: category.id,
        });

        const sessionsChannel = await guild.channels.create({
          name: '📊-live-sessions',
          type: ChannelType.GuildText,
          parent: category.id,
        });

        const logsChannel = await guild.channels.create({
          name: '🚨-terminal-logs',
          type: ChannelType.GuildText,
          parent: category.id,
        });

        const helpChannel = await guild.channels.create({
          name: '📖-help',
          type: ChannelType.GuildText,
          parent: category.id,
        });

        // Post Portal in Login Channel
        await loginChannel.send(embeds.loginHub());

        // Post Help Guide in Help Channel
        await helpChannel.send(embeds.helpGuide());

        return interaction.editReply({
          content: `✅ **WhatsApp Control Center Provisioned Successfully!**\n- Category: \`${category.name}\`\n- Login: <#${loginChannel.id}>\n- Sessions: <#${sessionsChannel.id}>\n- Logs: <#${logsChannel.id}>\n- Help: <#${helpChannel.id}>\n\n*(Add these IDs to your \`.env\` file for persistent tracking)*`,
        });
      } catch (err) {
        return interaction.editReply(`❌ Setup failed: ${err.message}`);
      }
    }

    // 2. STATUS
    if (sub === 'status') {
      const stats = whatsappManager.getStatus(userId);
      const embed = embeds.statusCard(stats.status, stats.phone, stats.uptime);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // 3. LOGOUT
    if (sub === 'logout') {
      await whatsappManager.logout(userId, interaction.client);
      return interaction.reply({
        content: '🔴 **Successfully disconnected and logged out of WhatsApp.** All keys and credentials purged.',
        ephemeral: true,
      });
    }

    // 4. CLOSE
    if (sub === 'close') {
      if (!interaction.channel.isThread()) {
        return interaction.reply({
          content: '⚠️ This command must be run inside a terminal thread.',
          ephemeral: true,
        });
      }
      await interaction.reply('🔒 *Closing workspace thread...*');
      await whatsappManager.logout(userId, interaction.client);
      storage.removeTerminal(userId);
      setTimeout(() => interaction.channel.delete().catch(() => {}), 1500);
      return;
    }

    // 5. LOGIN
    if (sub === 'login') {
      let targetThread = interaction.channel;

      // If user runs /whatsapp login outside a thread, find or spawn one
      if (!interaction.channel.isThread()) {
        const existing = storage.getTerminalByUser(userId);
        if (existing) {
          return interaction.reply({
            content: `⚠️ You already have an active WhatsApp terminal thread: <#${existing.threadId}>`,
            ephemeral: true,
          });
        }

        const thread = await interaction.channel.threads.create({
          name: `terminal-${interaction.user.username}`,
          type: ChannelType.PrivateThread,
          reason: 'WhatsApp Private Terminal',
        });
        await thread.members.add(userId);
        storage.setTerminal(userId, thread.id, interaction.channel.id);
        targetThread = thread;

        await interaction.reply({
          content: `✅ Initialized your private terminal thread: <#${thread.id}>`,
          ephemeral: true,
        });
      } else {
        await interaction.reply({ content: '🔄 *Initializing WhatsApp session...*', ephemeral: true });
      }

      const phone = interaction.options.getString('phone');
      await whatsappManager.startSession(userId, targetThread, interaction.client, { phone });
      return;
    }

    // 6. SEND MESSAGE
    if (sub === 'send') {
      const to = interaction.options.getString('to');
      const text = interaction.options.getString('message');

      await interaction.deferReply({ ephemeral: false });

      try {
        const sent = await whatsappManager.sendMessage(userId, to, text);
        const embed = embeds.outgoingMessage(to, text, sent.messageId);
        const discordReply = await interaction.editReply({ embeds: [embed] });

        // Save reference for delete & reply tracking
        storage.saveMessageRef(discordReply.id, {
          waMessageId: sent.messageId,
          waJid: sent.jid,
          sender: 'You',
        });
      } catch (err) {
        return interaction.editReply({
          content: `❌ **Failed to send WhatsApp message:** ${err.message}`,
        });
      }
      return;
    }

    // 7. DELETE / REVOKE MESSAGE
    if (sub === 'delete') {
      const messageId = interaction.options.getString('message_id');
      const to = interaction.options.getString('to');

      await interaction.deferReply({ ephemeral: true });

      try {
        await whatsappManager.deleteMessage(userId, to, messageId);
        return interaction.editReply({
          content: `🗑️ **Message \`${messageId}\` revoked for everyone on WhatsApp.**`,
        });
      } catch (err) {
        return interaction.editReply({
          content: `❌ Failed to delete message: ${err.message}`,
        });
      }
    }

    // 8. CONTACT ALIAS (NAME)
    if (sub === 'name') {
      const to = interaction.options.getString('to');
      const alias = interaction.options.getString('name');

      storage.setContactAlias(userId, to, alias);
      return interaction.reply({
        content: `✅ Assigned nickname **"${alias}"** to \`${to}\`.`,
        ephemeral: true,
      });
    }

    // 9. CONTACTS & SEARCH
    if (sub === 'contacts' || sub === 'search') {
      const query = interaction.options.getString('query')?.toLowerCase();
      const contacts = storage.getAllContacts(userId);
      const entries = Object.entries(contacts);

      if (entries.length === 0) {
        return interaction.reply({
          content: 'ℹ️ No custom contacts or nicknames saved yet. Use `/whatsapp name` to save one.',
          ephemeral: true,
        });
      }

      const filtered = query
        ? entries.filter(([jid, alias]) => jid.toLowerCase().includes(query) || alias.toLowerCase().includes(query))
        : entries;

      if (filtered.length === 0) {
        return interaction.reply({
          content: `🔍 No contacts matching \`${query}\` found.`,
          ephemeral: true,
        });
      }

      const listStr = filtered.map(([jid, alias]) => `• **${alias}** — \`${jid}\``).join('\n');
      const embed = new EmbedBuilder()
        .setColor(0x00A884)
        .setTitle('📇 Saved Contacts & Nicknames')
        .setDescription(listStr)
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
