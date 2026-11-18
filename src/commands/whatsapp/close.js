import { SlashCommandBuilder } from 'discord.js';
import { storage } from '../../utils/storage.js';
import { sessionManager } from '../../services/sessionManager.js';
import { logger } from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('close')
    .setDescription('Close and permanently delete this private WhatsApp terminal thread'),

  async execute(interaction) {
    if (!interaction.channel.isThread()) {
      return interaction.reply({
        content: '⚠️ This command can only be used inside a private terminal thread.',
        ephemeral: true,
      });
    }

    const threadOwnerId = storage.getUserByThread(interaction.channel.id);
    const isOwner = threadOwnerId === interaction.user.id;
    const isStaff = interaction.memberPermissions?.has('ManageThreads');

    if (!isOwner && !isStaff) {
      return interaction.reply({
        content: '⛔ Only the workspace owner or server moderators can close this thread.',
        ephemeral: true,
      });
    }

    await interaction.reply('🔒 *Closing workspace and purging credentials...*');

    if (threadOwnerId) {
      await sessionManager.logout(threadOwnerId, interaction.client);
      storage.removeTerminal(threadOwnerId);
    }

    // Short timeout so the user sees the confirmation message before deletion
    setTimeout(async () => {
      try {
        await interaction.channel.delete('Terminal closed by user request');
        logger.info(`Deleted terminal thread: ${interaction.channel.id}`);
      } catch (err) {
        logger.error(`Failed to delete thread: ${err.message}`);
      }
    }, 1500);
  },
};
