import { EmbedBuilder } from 'discord.js';
import { storage } from '../../../utils/storage.js';

export async function handleContacts(interaction) {
  const userId = interaction.user.id;
  const query = interaction.options.getString('query')?.toLowerCase();
  const contacts = storage.getAllContacts(userId);
  const entries = Object.entries(contacts);

  if (entries.length === 0) {
    return interaction.reply({
      content: 'ℹ️ You have not saved any contact nicknames yet. Use `/whatsapp name` to assign one.',
      ephemeral: true,
    });
  }

  const filtered = query
    ? entries.filter(([jid, name]) => jid.toLowerCase().includes(query) || name.toLowerCase().includes(query))
    : entries;

  if (filtered.length === 0) {
    return interaction.reply({
      content: `🔍 No saved contacts matching \`${query}\`.`,
      ephemeral: true,
    });
  }

  const list = filtered.map(([jid, name]) => `• **${name}** — \`${jid}\``).join('\n');
  const embed = new EmbedBuilder()
    .setColor(0x00A884)
    .setTitle('📇 Saved WhatsApp Contacts')
    .setDescription(list)
    .setFooter({ text: 'Wipro Connect Directory' })
    .setTimestamp();

  return interaction.reply({ embeds: [embed], ephemeral: true });
}
