# 📲 Wipro Connect — Discord to WhatsApp Encrypted Gateway

An enterprise-grade, end-to-end encrypted bridge bot that allows users and teams to manage **WhatsApp accounts directly inside Discord** using isolated, private terminal workspaces.

Built with **Node.js**, **Discord.js v14**, and **@whiskeysockets/baileys**.

---

## 🌟 Key Features

### 🔒 1. Private Terminal Workspaces
* **Zero Chat Leakage**: Instead of relaying sensitive WhatsApp messages to shared public channels, each member initializes an encrypted, private Discord thread visible **strictly to them**.
* **Anti-Intrusion Auto-Purge**: Any messages sent by unauthorized members inside a private terminal are automatically blocked and deleted.

### 🔑 2. Multi-Device Authentication
* **Instant QR Code Login**: Generates a scannable WhatsApp Web QR code directly inside the private Discord thread.
* **8-Digit Pairing Code**: Supports direct linking via phone number pairing code (`/whatsapp login phone:<number>`) without requiring QR scans.
* **Persistent Sessions**: Auth credentials are secure and auto-reconnect across gateway restarts.

### 💬 3. Full Two-Way WhatsApp Messaging
* **Send Outbound Messages**: `/whatsapp send to:<number/group> message:<text>` or via one-click **`[ 📤 Send Message ]`** modal UI.
* **Native Discord In-Thread Replies**: When a WhatsApp contact messages you, hover over the message embed in Discord, click **Reply (`↩️`)**, and type your reply. The bot pipes it straight to WhatsApp and marks the message with a `✅` to confirm delivery.
* **Message Revocation ("Delete for Everyone")**: `/whatsapp delete message_id:<id>` revokes sent messages for all recipients.

### 📇 4. Contacts & Aliases
* **Contact Nicknames**: `/whatsapp name to:<number> name:<alias>` lets you map long phone numbers to human-readable names.
* **Search**: `/whatsapp search query:<term>` filters contacts, groups, and message logs.

### ⚙️ 5. Automated Server Provisioning
* **Admin Setup**: `/whatsapp setup` provisions the entire `⚙️ WHATSAPP CONTROL CENTER` category with:
  * `#📲-whatsapp-login` (Interactive login hub with button)
  * `#📊-live-sessions` (Live session monitor)
  * `#🚨-terminal-logs` (Security and audit trails)
  * `#📖-help` (Documentation & button controls)

---

## 📁 Repository Structure

```
wipro-connect/
├── src/
│   ├── commands/
│   │   ├── general/
│   │   │   ├── info.js
│   │   │   └── ping.js
│   │   └── whatsapp/
│   │       ├── subcommands/
│   │       │   ├── login.js
│   │       │   ├── send.js
│   │       │   ├── delete.js
│   │       │   ├── contacts.js
│   │       │   ├── search.js
│   │       │   ├── name.js
│   │       │   ├── status.js
│   │       │   ├── logout.js
│   │       │   ├── close.js
│   │       │   └── setup.js
│   │       ├── close.js       # Top-level /close shortcut
│   │       └── index.js       # Master /whatsapp command router
│   ├── events/
│   │   ├── interactionCreate.js
│   │   ├── messageCreate.js
│   │   └── ready.js
│   ├── handlers/
│   │   ├── buttonHandler.js
│   │   ├── commandHandler.js
│   │   └── modalHandler.js
│   ├── services/
│   │   ├── messageRouter.js   # Inbound & outbound routing
│   │   └── sessionManager.js  # Baileys Multi-Device socket manager
│   ├── ui/
│   │   ├── buttons.js
│   │   ├── embeds.js
│   │   └── modals.js
│   ├── utils/
│   │   ├── formatters.js      # Phone, JID, and uptime helpers
│   │   ├── logger.js          # Timestamped console logger
│   │   └── storage.js         # Debounced JSON database
│   ├── config.js
│   └── index.js               # Entry point
├── scripts/
│   ├── deploy-commands.js     # Register slash commands
│   └── clear-commands.js      # Wipe slash commands (utility)
├── .env.example
├── .gitignore
├── .prettierrc
├── nodemon.json
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js** (v18.0.0 or higher)
* **npm** or **yarn**
* A registered **Discord Application** from the [Discord Developer Portal](https://discord.com/developers/applications)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/amvaltrx/wipro-connect.git
cd wipro-connect

# Install dependencies
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```env
DISCORD_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_discord_application_id_here
GUILD_ID=your_discord_server_id_here

# Optional: Auto-filled after running /whatsapp setup
LOGIN_CHANNEL_ID=
SESSIONS_CHANNEL_ID=
LOGS_CHANNEL_ID=
HELP_CHANNEL_ID=
```

### 4. Deploy Slash Commands
Register all Slash Commands with Discord:
```bash
npm run deploy
```

### 5. Start the Bot
```bash
# Development (with auto-restart via nodemon)
npm run dev

# Production
npm start
```

---

## 📖 Command Reference

| Command | Subcommand / Options | Description |
| :--- | :--- | :--- |
| `/whatsapp` | `login [phone]` | Initialize WhatsApp login via QR code or 8-digit pairing code |
| `/whatsapp` | `send to:<number/group> message:<text>` | Send a WhatsApp message to an individual or group |
| `/whatsapp` | `delete message_id:<id> [to]` | Revoke / delete a sent message for everyone on WhatsApp |
| `/whatsapp` | `contacts [query]` | View and filter saved contacts and nicknames |
| `/whatsapp` | `search query:<term>` | Search contacts, groups, or message history |
| `/whatsapp` | `name to:<number> name:<nickname>` | Assign a friendly nickname to a phone number |
| `/whatsapp` | `status` | View connection state, linked number, and session uptime |
| `/whatsapp` | `logout` | Unlink WhatsApp account and delete auth session keys |
| `/whatsapp` | `close` | Close and delete the current terminal thread |
| `/whatsapp` | `setup` | Provision WhatsApp Control Center category and channels (Admin) |
| `/ping` | — | Check Discord API and bot gateway latency |
| `/info` | — | View bot system metrics, uptime, and active session count |
| `/close` | — | Shortcut to close and delete the active terminal thread |

---

## 🌐 Cloud Deployment (Render / VPS)

### Option A: Render.com
1. Create a **New Background Worker** or **Web Service**.
2. Connect your GitHub repository.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add your Environment Secrets (`DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID`) under the **Environment** tab.

### Option B: VPS (Ubuntu / Debian with PM2)
```bash
npm install -g pm2
pm2 start src/index.js --name "wipro-connect"
pm2 save
pm2 startup
```

---

## 📄 License
This project is licensed under the MIT License.
