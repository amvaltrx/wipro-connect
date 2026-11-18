import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { whatsappManager } from '../utils/whatsappManager.js';

export default {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Display bot system information, uptime and operational metrics'),

  async execute(interaction) {
    const activeCount = whatsappManager.activeSessions.size;
    const uptime = Math.floor(process.uptime());
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    const embed = new EmbedBuilder()
      .setColor(0x00A884)
      .setTitle('ℹ️ Wipro Connect — System Metrics')
      .setDescription('Enterprise Discord-to-WhatsApp encrypted communication hub.')
      .addFields(
        { name: '🤖 Bot Name', value: 'Wipro Connect', inline: true },
        { name: '🟢 Active WhatsApp Sessions', value: `\`${activeCount}\``, inline: true },
        { name: '⏱️ Bot Process Uptime', value: `\`${hours}h ${minutes}m\``, inline: true },
        { name: '📦 Node.js Version', value: `\`${process.version}\``, inline: true },
        { name: '🛡️ Encryption', value: '`End-to-End Multi-Device`', inline: true }
      )
      .setFooter({ text: 'Wipro Connect Gateway' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
