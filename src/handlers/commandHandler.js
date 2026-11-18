import { Collection } from 'discord.js';
import pingCmd from '../commands/general/ping.js';
import infoCmd from '../commands/general/info.js';
import closeCmd from '../commands/whatsapp/close.js';
import whatsappCmd from '../commands/whatsapp/index.js';
import { logger } from '../utils/logger.js';

export function loadCommands() {
  const commands = new Collection();

  const commandList = [pingCmd, infoCmd, closeCmd, whatsappCmd];

  for (const cmd of commandList) {
    if (cmd.data && cmd.execute) {
      commands.set(cmd.data.name, cmd);
      logger.info(`Loaded command: /${cmd.data.name}`);
    } else {
      logger.warn(`Skipping invalid command structure: ${cmd}`);
    }
  }

  return commands;
}
