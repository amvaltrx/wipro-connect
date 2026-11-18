import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { loadCommands } from './handlers/commandHandler.js';
import { handleReady } from './events/ready.js';
import { handleInteraction } from './events/interactionCreate.js';
import { handleMessage } from './events/messageCreate.js';

// Setup Discord Client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// Load application commands
client.commands = loadCommands();

// Register Gateway Events
client.once('ready', () => handleReady(client));
client.on('interactionCreate', (interaction) => handleInteraction(interaction, client));
client.on('messageCreate', (message) => handleMessage(message));

// Uncaught exception guards to prevent hard crash
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
});

// Start Bot
logger.discord('Connecting to Discord gateway...');
client.login(config.token).catch((err) => {
  logger.error('Failed to authenticate with Discord:', err.message);
  process.exit(1);
});
