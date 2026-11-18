import { sessionManager } from '../../../services/sessionManager.js';
import { messageRouter } from '../../../services/messageRouter.js';
import { embeds } from '../../../ui/embeds.js';
import { storage } from '../../../utils/storage.js';

export async function handleSend(interaction) {
  const userId = interaction.user.id;
  const to = interaction.options.getString('to');
  const text = interaction.options.getString('message');

  const session = sessionManager.getSession(userId);
  if (!session || session.status !== 'Online') {
    return interaction.reply({
      content: '❌ Your WhatsApp terminal is not online. Please run `/whatsapp login` first.',
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: false });

  try {
    const sent = await messageRouter.send(session.sock, to, text);
    const embed = embeds.outgoingMessage(to, text, sent.messageId);
    const reply = await interaction.editReply({ embeds: [embed] });

    // Track for deletion and native reply
    storage.saveMessageRef(reply.id, {
      waMessageId: sent.messageId,
      waJid: sent.jid,
      sender: 'You',
    });
  } catch (err) {
    return interaction.editReply({
      content: `❌ **Failed to deliver WhatsApp message:** ${err.message}`,
    });
  }
}
