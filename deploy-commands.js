import { REST, Routes } from 'discord.js';
import { config } from './utils/config.js';
import infoCmd from './commands/info.js';
import pingCmd from './commands/ping.js';
import closeCmd from './commands/close.js';
import whatsappCmd from './commands/whatsapp.js';

const commands = [
  infoCmd.data.toJSON(),
  pingCmd.data.toJSON(),
  closeCmd.data.toJSON(),
  whatsappCmd.data.toJSON(),
];

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    console.log(`[DEPLOY] Started refreshing ${commands.length} application (/) commands...`);

    // Registering to Guild
    if (config.guildId) {
      const data = await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: commands }
      );
      console.log(`[DEPLOY] Successfully registered ${data.length} guild commands in Guild: ${config.guildId}!`);
    } else {
      const data = await rest.put(
        Routes.applicationCommands(config.clientId),
        { body: commands }
      );
      console.log(`[DEPLOY] Successfully registered ${data.length} global commands!`);
    }
  } catch (error) {
    console.error('[DEPLOY ERROR]', error);
  }
})();
