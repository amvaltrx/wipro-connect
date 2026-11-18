import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const buttons = {
  // Login button in the public login channel
  openTerminal() {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_open_wa_terminal')
        .setLabel('🔑 Login to WhatsApp')
        .setStyle(ButtonStyle.Success)
    );
  },

  // Action buttons inside the private terminal
  terminalControls() {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_send_modal')
        .setLabel('📤 Send Message')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('btn_status')
        .setLabel('📊 Status')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('btn_disconnect')
        .setLabel('🔴 Disconnect')
        .setStyle(ButtonStyle.Danger)
    );
  },
};
