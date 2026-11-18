import { sessionManager } from '../../../services/sessionManager.js';

export async function handleLogout(interaction) {
  const userId = interaction.user.id;
  await sessionManager.logout(userId, interaction.client);

  return interaction.reply({
    content: '🔴 **Successfully disconnected.** Session credentials purged from disk.',
    ephemeral: true,
  });
}
