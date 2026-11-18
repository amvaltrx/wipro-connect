import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';

export const modals = {
  sendMessage() {
    const modal = new ModalBuilder()
      .setCustomId('modal_send_whatsapp')
      .setTitle('📤 Send WhatsApp Message');

    const toInput = new TextInputBuilder()
      .setCustomId('input_to')
      .setLabel('Recipient (Phone number or Group JID)')
      .setPlaceholder('+91 98765 43210 or 120363024859345678@g.us')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const msgInput = new TextInputBuilder()
      .setCustomId('input_msg')
      .setLabel('Message')
      .setPlaceholder('Type your message to send on WhatsApp...')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(toInput),
      new ActionRowBuilder().addComponents(msgInput)
    );

    return modal;
  },
};
