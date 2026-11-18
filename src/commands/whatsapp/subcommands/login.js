import { ChannelType } from 'discord.js';
import { sessionManager } from '../../../services/sessionManager.js';
import { storage } from '../../../utils/storage.js';

export async function handleLogin(interaction) {
  const userId = interaction.user.id;
  let targetThread = interaction.channel;

  // If user calls /whatsapp login in a regular channel, spawn a private thread first
  if (!interaction.channel.isThread()) {
    const existing = storage.getTerminalByUser(userId);
    if (existing) {
      return interaction.reply({
        content: `⚠️ You already have an active WhatsApp terminal: <#${existing.threadId}>`,
        ephemeral: true,
      });
    }

    const thread = await interaction.channel.threads.create({
      name: `terminal-${interaction.user.username}`,
      type: ChannelType.PrivateThread,
      reason: 'Encrypted WhatsApp Terminal',
    });

    await thread.members.add(userId);
    storage.setTerminal(userId, thread.id, interaction.channel.id);
    targetThread = thread;

    await interaction.reply({
      content: `✅ Initialized your private terminal thread: <#${thread.id}>`,
      ephemeral: true,
    });
  } else {
    await interaction.reply({ content: '🔄 *Initializing WhatsApp socket session...*', ephemeral: true });
  }

  const phone = interaction.options.getString('phone');
  await sessionManager.start(userId, targetThread, interaction.client, { phone });
}
