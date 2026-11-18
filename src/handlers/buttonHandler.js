import { ChannelType } from 'discord.js';
import { storage } from '../utils/storage.js';
import { sessionManager } from '../services/sessionManager.js';
import { embeds } from '../ui/embeds.js';
import { modals } from '../ui/modals.js';
import { logger } from '../utils/logger.js';

export async function handleButtonInteraction(interaction) {
  const userId = interaction.user.id;
  const customId = interaction.customId;

  // 1. Open Terminal Button
  if (customId === 'btn_open_wa_terminal') {
    const existing = storage.getTerminalByUser(userId);
    if (existing) {
      return interaction.reply({
        content: `ℹ️ You already have an active terminal thread: <#${existing.threadId}>`,
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const thread = await interaction.channel.threads.create({
        name: `terminal-${interaction.user.username}`,
        type: ChannelType.PrivateThread,
        reason: 'Private WhatsApp Workspace',
      });

      await thread.members.add(userId);
      storage.setTerminal(userId, thread.id, interaction.channel.id);

      await interaction.editReply({
        content: `✅ **Workspace Created!** Open your terminal: <#${thread.id}>`,
      });

      await thread.send({
        content:
          `👋 **Welcome <@${userId}>!** Connecting your terminal socket...\n` +
          `• Scan the QR code below, or run \`/whatsapp login phone:<number>\` for an 8-digit pairing code.`,
      });

      await sessionManager.start(userId, thread, interaction.client);
    } catch (err) {
      logger.error('Failed to create terminal thread:', err.message);
      return interaction.editReply(`❌ Could not create terminal: ${err.message}`);
    }
    return;
  }

  // 2. Send Message Modal Opener
  if (customId === 'btn_send_modal') {
    return interaction.showModal(modals.sendMessage());
  }

  // 3. Live Status Button
  if (customId === 'btn_status') {
    const stats = sessionManager.getStatus(userId);
    const embed = embeds.statusCard(stats.status, stats.phone, stats.uptime);
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // 4. Disconnect Button
  if (customId === 'btn_disconnect') {
    await sessionManager.logout(userId, interaction.client);
    return interaction.reply({
      content: '🔴 **Successfully disconnected and logged out of WhatsApp.**',
      ephemeral: true,
    });
  }
}
