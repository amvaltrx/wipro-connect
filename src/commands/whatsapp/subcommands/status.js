import { sessionManager } from '../../../services/sessionManager.js';
import { embeds } from '../../../ui/embeds.js';

export async function handleStatus(interaction) {
  const userId = interaction.user.id;
  const stats = sessionManager.getStatus(userId);
  const embed = embeds.statusCard(stats.status, stats.phone, stats.uptime);

  return interaction.reply({ embeds: [embed], ephemeral: true });
}
