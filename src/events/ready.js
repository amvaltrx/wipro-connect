import { ActivityType } from 'discord.js';
import { logger } from '../utils/logger.js';

export function handleReady(client) {
  logger.discord(`Gateway connected! Logged in as ${client.user.tag} (${client.user.id})`);
  client.user.setActivity('/whatsapp | Encrypted Gateway', { type: ActivityType.Custom });
}
