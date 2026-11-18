import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let store = {
  terminals: {}, // userId -> { threadId, channelId, createdAt }
  threads: {},   // threadId -> userId
  contacts: {},  // userId -> { [jid]: alias }
  messages: {},  // discordMessageId -> { waMessageId, waJid, sender, timestamp }
};

// Initial load
if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    store = { ...store, ...JSON.parse(raw) };
  } catch (err) {
    logger.error('Failed to parse store.json:', err.message);
  }
}

let flushTimeout = null;
function scheduleSave() {
  // Debounce writes so high message volume doesn't thrash disk
  if (flushTimeout) return;
  flushTimeout = setTimeout(() => {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf-8');
    } catch (e) {
      logger.error('Failed to save store.json:', e.message);
    }
    flushTimeout = null;
  }, 500);
}

export const storage = {
  // Terminal mapping
  setTerminal(userId, threadId, channelId) {
    store.terminals[userId] = { threadId, channelId, createdAt: Date.now() };
    store.threads[threadId] = userId;
    scheduleSave();
  },

  getTerminalByUser(userId) {
    return store.terminals[userId] || null;
  },

  getUserByThread(threadId) {
    return store.threads[threadId] || null;
  },

  removeTerminal(userId) {
    const term = store.terminals[userId];
    if (term) {
      delete store.threads[term.threadId];
      delete store.terminals[userId];
      scheduleSave();
    }
  },

  // Contact Nicknames
  setContactAlias(userId, jid, alias) {
    if (!store.contacts[userId]) store.contacts[userId] = {};
    store.contacts[userId][jid] = alias;
    scheduleSave();
  },

  getContactAlias(userId, jid) {
    return store.contacts[userId]?.[jid] || null;
  },

  getAllContacts(userId) {
    return store.contacts[userId] || {};
  },

  // Message Reference for native reply
  saveMessageRef(discordMsgId, { waMessageId, waJid, sender }) {
    store.messages[discordMsgId] = {
      waMessageId,
      waJid,
      sender,
      timestamp: Date.now(),
    };
    scheduleSave();
  },

  getMessageRef(discordMsgId) {
    return store.messages[discordMsgId] || null;
  },
};
