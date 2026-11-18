import { sessionManager } from '../services/sessionManager.js';
import { messageRouter } from '../services/messageRouter.js';
import { embeds } from '../ui/embeds.js';
import { storage } from '../utils/storage.js';
import { logger } from '../utils/logger.js';

export async function handleModalSubmission(interaction) {
  if (interaction.customId === 'modal_send_whatsapp') {
    const to = interaction.fields.getTextInputValue('input_to');
    const text = interaction.fields.getTextInputValue('input_msg');
    const userId = interaction.user.id;

    const session = sessionManager.getSession(userId);
    if (!session || session.status !== 'Online') {
      return interaction.reply({
        content: '❌ WhatsApp terminal is not active. Run `/whatsapp login` first.',
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: false });

    try {
      const sent = await messageRouter.send(session.sock, to, text);
      const embed = embeds.outgoingMessage(to, text, sent.messageId);
      const reply = await interaction.editReply({ embeds: [embed] });

      storage.saveMessageRef(reply.id, {
        waMessageId: sent.messageId,
        waJid: sent.jid,
        sender: 'You',
      });
    } catch (err) {
      logger.error('Modal message send failed:', err.message);
      return interaction.editReply(`❌ Failed to deliver message: ${err.message}`);
    }
  }
}
