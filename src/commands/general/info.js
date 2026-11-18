import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { sessionManager } from '../../services/sessionManager.js';

export default {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Display bot system information, uptime and operational metrics'),

  async execute(interaction) {
    const activeCount = sessionManager.activeSessions.size;
    const uptimeSec = Math.floor(process.uptime());
    const hours = Math.floor(uptimeSec / 3600);
    const mins = Math.floor((uptimeSec % 3600) / 60);

    const embed = new EmbedBuilder()
      .setColor(0x00A884)
      .setTitle('ℹ️ Wipro Connect — System Metrics')
      .setDescription('Enterprise Discord-to-WhatsApp encrypted communication hub.')
      .addFields(
        { name: '🤖 Bot Name', value: 'Wipro Connect', inline: true },
        { name: '🟢 Active Sessions', value: `\`${activeCount}\``, inline: true },
        { name: '⏱️ Uptime', value: `\`${hours}h ${mins}m\``, inline: true },
        { name: '📦 Node Version', value: `\`${process.version}\``, inline: true },
        { name: '🔒 Security', value: '`End-to-End Encrypted`', inline: true }
      )
      .setFooter({ text: 'Wipro Connect Gateway' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
