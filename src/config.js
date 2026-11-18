import dotenv from 'dotenv';
dotenv.config();

function required(key, fallback = null) {
  const value = process.env[key] || fallback;
  if (!value) {
    console.warn(`[WARN] Missing environment variable: ${key}`);
  }
  return value;
}

export const config = {
  token: required('DISCORD_TOKEN'),
  clientId: required('CLIENT_ID', '1567126706416779316'),
  guildId: process.env.GUILD_ID || '1538611354523668621',

  // Pre-configured channels (set manually or populated via /whatsapp setup)
  channels: {
    login: process.env.LOGIN_CHANNEL_ID || '1567154499221725296',
    sessions: process.env.SESSIONS_CHANNEL_ID || '1567154508251799572',
    logs: process.env.LOGS_CHANNEL_ID || '1567154514216231014',
    help: process.env.HELP_CHANNEL_ID || '1567167070490329149',
  },
};
