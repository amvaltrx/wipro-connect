import { REST, Routes } from 'discord.js';
import { config } from '../src/config.js';
import { logger } from '../src/utils/logger.js';

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    logger.warn('Clearing all registered application commands...');

    if (config.guildId) {
      await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: [] });
      logger.info(`Cleared all guild commands in ${config.guildId}`);
    }

    await rest.put(Routes.applicationCommands(config.clientId), { body: [] });
    logger.info('Cleared all global commands.');
  } catch (err) {
    logger.error('Failed to clear commands:', err);
  }
})();
