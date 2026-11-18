import dotenv from 'dotenv';
dotenv.config();

export const config = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID || '1567126706416779316',
  guildId: process.env.GUILD_ID || '1538611354523668621',
  loginChannelId: process.env.LOGIN_CHANNEL_ID || '1567154499221725296',
  sessionsChannelId: process.env.SESSIONS_CHANNEL_ID || '1567154508251799572',
  logsChannelId: process.env.LOGS_CHANNEL_ID || '1567154514216231014',
  helpChannelId: process.env.HELP_CHANNEL_ID || '1567167070490329149',
};
