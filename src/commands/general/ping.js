import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency and gateway responsiveness'),

  async execute(interaction) {
    const sent = await interaction.reply({
      content: '🏓 Pinging gateway...',
      fetchReply: true,
      ephemeral: true,
    });

    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const wsPing = Math.round(interaction.client.ws.ping);

    const embed = new EmbedBuilder()
      .setColor(0x25D366)
      .setTitle('🏓 Pong!')
      .addFields(
        { name: '⚡ Roundtrip Latency', value: `\`${latency}ms\``, inline: true },
        { name: '🌐 Discord Gateway Ping', value: `\`${wsPing}ms\``, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ content: null, embeds: [embed] });
  },
};
