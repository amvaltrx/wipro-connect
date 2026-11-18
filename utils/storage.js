import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let db = {
  terminals: {}, // userId -> { threadId, channelId, createdAt }
  threads: {},   // threadId -> userId
  contacts: {},  // userId -> { [jidOrPhone]: alias }
  messages: {},  // discordMessageId -> { waMessageId, waJid, sender, timestamp }
};

if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    db = { ...db, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to load database.json:', err);
  }
}

function save() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save database.json:', err);
  }
}

export const storage = {
  // Terminal mapping
  setTerminal(userId, threadId, channelId) {
    db.terminals[userId] = { threadId, channelId, createdAt: Date.now() };
    db.threads[threadId] = userId;
    save();
  },
  getTerminalByUser(userId) {
    return db.terminals[userId] || null;
  },
  getUserByThread(threadId) {
    return db.threads[threadId] || null;
  },
  removeTerminal(userId) {
    const term = db.terminals[userId];
    if (term) {
      delete db.threads[term.threadId];
      delete db.terminals[userId];
      save();
    }
  },

  // Contact Aliases
  setContactAlias(userId, jidOrPhone, alias) {
    if (!db.contacts[userId]) db.contacts[userId] = {};
    db.contacts[userId][jidOrPhone] = alias;
    save();
  },
  getContactAlias(userId, jidOrPhone) {
    return db.contacts[userId]?.[jidOrPhone] || null;
  },
  getAllContacts(userId) {
    return db.contacts[userId] || {};
  },

  // Inbound & Outbound Message Reference
  saveMessageRef(discordMsgId, { waMessageId, waJid, sender }) {
    db.messages[discordMsgId] = {
      waMessageId,
      waJid,
      sender,
      timestamp: Date.now(),
    };
    save();
  },
  getMessageRef(discordMsgId) {
    return db.messages[discordMsgId] || null;
  },
};
