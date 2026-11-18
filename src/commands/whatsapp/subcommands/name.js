import { storage } from '../../../utils/storage.js';
import { toWhatsAppJid } from '../../../utils/formatters.js';

export async function handleName(interaction) {
  const userId = interaction.user.id;
  const to = interaction.options.getString('to');
  const name = interaction.options.getString('name');

  const jid = toWhatsAppJid(to);
  storage.setContactAlias(userId, jid, name);

  return interaction.reply({
    content: `✅ Saved nickname **"${name}"** for \`${jid}\`.`,
    ephemeral: true,
  });
}
