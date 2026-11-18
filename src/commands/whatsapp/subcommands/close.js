import { sessionManager } from '../../../services/sessionManager.js';
import { storage } from '../../../utils/storage.js';

export async function handleClose(interaction) {
  if (!interaction.channel.isThread()) {
    return interaction.reply({
      content: '⚠️ This command must be executed inside a terminal thread.',
      ephemeral: true,
    });
  }

  const userId = interaction.user.id;
  await interaction.reply('🔒 *Closing workspace thread...*');

  await sessionManager.logout(userId, interaction.client);
  storage.removeTerminal(userId);

  setTimeout(() => {
    interaction.channel.delete().catch(() => {});
  }, 1200);
}
