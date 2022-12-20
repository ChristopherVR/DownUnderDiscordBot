import { ApplicationCommandType, ChatInputCommandInteraction, ApplicationCommandOptionType } from 'discord.js';
import i18next from 'i18next';
import { ask } from '../openai/ai';
import { Command } from '../types';
import getLocalizations from './i18n/discordLocalization';

export const Ask: Command<ChatInputCommandInteraction> = {
  name: i18next.t('global:ask'),
  nameLocalizations: getLocalizations('global:ask'),
  description: i18next.t('global:returnsResponseUsingOpenAi'),
  descriptionLocalizations: getLocalizations('global:returnsResponseUsingOpenAi'),
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: i18next.t('global:input'),
      nameLocalizations: getLocalizations('global:input'),
      description: i18next.t('global:textToSearchFor'),
      descriptionLocalizations: getLocalizations('global:textToSearchFor'),
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  run: async (interaction: ChatInputCommandInteraction) => {
    const input = interaction.options.getString('input') ?? '';
    const answer = (await ask(input)) ?? ''; // prompt GPT-3
    await interaction.channel?.send(answer);
  },
};

export default Ask;
