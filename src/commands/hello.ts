import { ApplicationCommandType, ChatInputCommandInteraction } from 'discord.js';
import i18next from 'i18next';
import { Command } from '../types';
import getLocalizations from './i18n/discordLocalization';

const Hello: Command<ChatInputCommandInteraction> = {
  name: i18next.t('global:hello'),
  nameLocalizations: getLocalizations('global:hello'),
  description: i18next.t('global:helloDesc'),
  descriptionLocalizations: getLocalizations('global:helloDesc'),

  type: ApplicationCommandType.ChatInput,
  run: async (interaction: ChatInputCommandInteraction) => {
    const content = 'NEIN, NEIN, NEIN, NEIN!';
    await interaction.followUp({
      ephemeral: true,
      content,
    });
  },
};

export default Hello;
