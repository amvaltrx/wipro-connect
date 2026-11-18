import { handleButtonInteraction } from '../handlers/buttonHandler.js';
import { handleModalSubmission } from '../handlers/modalHandler.js';
import { logger } from '../utils/logger.js';

export async function handleInteraction(interaction, client) {
  // 1. Slash commands
  if (interaction.isChatInputCommand()) {
    const cmd = client.commands.get(interaction.commandName);
    if (!cmd) return;

    try {
      await cmd.execute(interaction);
    } catch (err) {
      logger.error(`Error executing /${interaction.commandName}:`, err);
      const replyFn = interaction.replied || interaction.deferred ? 'editReply' : 'reply';
      await interaction[replyFn]({
        content: `❌ Command execution failed: ${err.message}`,
        ephemeral: true,
      });
    }
    return;
  }

  // 2. Button clicks
  if (interaction.isButton()) {
    try {
      await handleButtonInteraction(interaction);
    } catch (err) {
      logger.error(`Error handling button ${interaction.customId}:`, err);
    }
    return;
  }

  // 3. Modal submissions
  if (interaction.isModalSubmit()) {
    try {
      await handleModalSubmission(interaction);
    } catch (err) {
      logger.error(`Error handling modal submit:`, err);
    }
    return;
  }
}
