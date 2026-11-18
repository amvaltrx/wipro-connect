import { REST, Routes } from 'discord.js';
import { config } from '../src/config.js';
import { logger } from '../src/utils/logger.js';
import pingCmd from '../src/commands/general/ping.js';
import infoCmd from '../src/commands/general/info.js';
import closeCmd from '../src/commands/whatsapp/close.js';
import whatsappCmd from '../src/commands/whatsapp/index.js';

const commands = [
  pingCmd.data.toJSON(),
  infoCmd.data.toJSON(),
  closeCmd.data.toJSON(),
  whatsappCmd.data.toJSON(),
];

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    logger.info(`Started refreshing ${commands.length} application (/) commands...`);

    if (config.guildId) {
      const data = await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: commands }
      );
      logger.info(`Successfully reloaded ${data.length} commands in guild ${config.guildId}`);
    } else {
      const data = await rest.put(
        Routes.applicationCommands(config.clientId),
        { body: commands }
      );
      logger.info(`Successfully registered ${data.length} global commands.`);
    }
  } catch (error) {
    logger.error('Deploy commands error:', error);
  }
})();
