import { sessionManager } from '../../../services/sessionManager.js';
import { messageRouter } from '../../../services/messageRouter.js';

export async function handleDelete(interaction) {
  const userId = interaction.user.id;
  const messageId = interaction.options.getString('message_id');
  const to = interaction.options.getString('to');

  const session = sessionManager.getSession(userId);
  if (!session || session.status !== 'Online') {
    return interaction.reply({
      content: '❌ WhatsApp terminal is not active.',
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    await messageRouter.delete(session.sock, to, messageId);
    return interaction.editReply({
      content: `🗑️ **Message \`${messageId}\` revoked for everyone on WhatsApp.**`,
    });
  } catch (err) {
    return interaction.editReply({
      content: `❌ Could not revoke message: ${err.message}`,
    });
  }
}
