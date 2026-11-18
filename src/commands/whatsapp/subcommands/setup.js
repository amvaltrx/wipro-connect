import { ChannelType, PermissionFlagsBits } from 'discord.js';
import { embeds } from '../../../ui/embeds.js';
import { buttons } from '../../../ui/buttons.js';
import { logger } from '../../../utils/logger.js';

export async function handleSetup(interaction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({
      content: '⛔ Administrator permissions required to run setup.',
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });
  const guild = interaction.guild;

  try {
    logger.info(`Starting server setup in ${guild.name} (${guild.id})...`);

    // 1. Create Category
    const category = await guild.channels.create({
      name: '⚙️ WHATSAPP CONTROL CENTER',
      type: ChannelType.GuildCategory,
    });

    // 2. Create Channels
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

    // 3. Post Public Hub Cards
    await loginChannel.send({
      embeds: [embeds.loginHub()],
      components: [buttons.openTerminal()],
    });

    await helpChannel.send({
      embeds: [embeds.helpGuide()],
      components: [buttons.terminalControls()],
    });

    logger.info('Control center provisioned successfully!');

    return interaction.editReply({
      content:
        `✅ **WhatsApp Control Center Provisioned!**\n` +
        `• Category: \`${category.name}\`\n` +
        `• Login Portal: <#${loginChannel.id}>\n` +
        `• Live Sessions: <#${sessionsChannel.id}>\n` +
        `• Audit Logs: <#${logsChannel.id}>\n` +
        `• User Guide: <#${helpChannel.id}>\n\n` +
        `*(Optional: add these channel IDs to your \`.env\` for persistent logging)*`,
    });
  } catch (err) {
    logger.error('Setup failed:', err);
    return interaction.editReply(`❌ Provisioning failed: ${err.message}`);
  }
}
