import { SlashCommandBuilder } from 'discord.js';
import { storage } from '../utils/storage.js';
import { whatsappManager } from '../utils/whatsappManager.js';

export default {
  data: new SlashCommandBuilder()
    .setName('close')
    .setDescription('Close and permanently delete this private WhatsApp terminal thread'),

  async execute(interaction) {
    if (!interaction.channel.isThread()) {
      return interaction.reply({
        content: '⚠️ This command can only be used inside a private WhatsApp terminal thread.',
        ephemeral: true,
      });
    }

    const threadOwnerId = storage.getUserByThread(interaction.channel.id);
    if (threadOwnerId && threadOwnerId !== interaction.user.id && !interaction.memberPermissions?.has('ManageThreads')) {
      return interaction.reply({
        content: '⛔ Only the terminal owner or server staff can close this workspace.',
        ephemeral: true,
      });
    }

    await interaction.reply('🔒 *Closing and wiping WhatsApp terminal thread...*');

    if (threadOwnerId) {
      await whatsappManager.logout(threadOwnerId, interaction.client);
      storage.removeTerminal(threadOwnerId);
    }

    setTimeout(async () => {
      try {
        await interaction.channel.delete('Terminal closed by user');
      } catch (err) {
        console.error('Failed to delete thread:', err);
      }
    }, 2000);
  },
};
