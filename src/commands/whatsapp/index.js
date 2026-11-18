import { SlashCommandBuilder } from 'discord.js';

import { handleLogin } from './subcommands/login.js';
import { handleSend } from './subcommands/send.js';
import { handleDelete } from './subcommands/delete.js';
import { handleContacts } from './subcommands/contacts.js';
import { handleSearch } from './subcommands/search.js';
import { handleName } from './subcommands/name.js';
import { handleStatus } from './subcommands/status.js';
import { handleLogout } from './subcommands/logout.js';
import { handleClose } from './subcommands/close.js';
import { handleSetup } from './subcommands/setup.js';

const subcommands = {
  login: handleLogin,
  send: handleSend,
  delete: handleDelete,
  contacts: handleContacts,
  search: handleSearch,
  name: handleName,
  status: handleStatus,
  logout: handleLogout,
  close: handleClose,
  setup: handleSetup,
};

export default {
  data: new SlashCommandBuilder()
    .setName('whatsapp')
    .setDescription('WhatsApp terminal controls and commands')
    .addSubcommand((sub) =>
      sub
        .setName('login')
        .setDescription('Start WhatsApp login with QR code or direct 8-digit pairing code')
        .addStringOption((opt) =>
          opt
            .setName('phone')
            .setDescription('Optional phone number with country code to link via 8-digit code (e.g. 919876543210)')
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('send')
        .setDescription('Send a WhatsApp message to a contact, phone number, or group')
        .addStringOption((opt) =>
          opt
            .setName('to')
            .setDescription('Recipient contact name, group, or phone number')
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName('message')
            .setDescription('Message text to deliver')
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('contacts')
        .setDescription('View WhatsApp contacts and aliases')
        .addStringOption((opt) =>
          opt
            .setName('query')
            .setDescription('Optional name or phone number filter')
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('search')
        .setDescription('Search WhatsApp contacts and groups by name, number, or message')
        .addStringOption((opt) =>
          opt
            .setName('query')
            .setDescription('Name, nickname, phone number, or message keyword')
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('name')
        .setDescription('Assign or update a custom contact name/nickname')
        .addStringOption((opt) =>
          opt
            .setName('to')
            .setDescription('Recipient contact, phone number, or existing nickname')
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName('name')
            .setDescription('New friendly name or nickname for this contact')
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('delete')
        .setDescription('Revoke / delete a sent WhatsApp message for everyone')
        .addStringOption((opt) =>
          opt
            .setName('message_id')
            .setDescription('WhatsApp Message ID to revoke')
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName('to')
            .setDescription('Optional recipient contact, group, or phone (auto-detected if omitted)')
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('status')
        .setDescription('Check your current WhatsApp terminal status')
    )
    .addSubcommand((sub) =>
      sub
        .setName('logout')
        .setDescription('Disconnect and unlink your WhatsApp account')
    )
    .addSubcommand((sub) =>
      sub
        .setName('close')
        .setDescription('Close and permanently delete this private WhatsApp terminal thread')
    )
    .addSubcommand((sub) =>
      sub
        .setName('setup')
        .setDescription('Provision WhatsApp Control Center in this server (Admin only)')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const handler = subcommands[sub];

    if (!handler) {
      return interaction.reply({
        content: `⚠️ Unknown subcommand: \`${sub}\``,
        ephemeral: true,
      });
    }

    return handler(interaction);
  },
};
