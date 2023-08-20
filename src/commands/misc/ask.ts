import {
  ApplicationCommandType,
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
  ChannelType,
} from 'discord.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { ask } from '../openai/ai.js';
import { Command } from '../../models/discord.js';
import getLocalizations from '../../helpers/localization/getLocalizations.js';

export const Ask: Command<ChatInputCommandInteraction> = {
  name: localizedString('global:ask'),
  nameLocalizations: getLocalizations('global:ask'),
  description: localizedString('global:returnsResponseUsingOpenAi'),
  descriptionLocalizations: getLocalizations('global:returnsResponseUsingOpenAi'),
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: localizedString('global:input'),
      nameLocalizations: getLocalizations('global:input'),
      description: localizedString('global:textToSearchFor'),
      descriptionLocalizations: getLocalizations('global:textToSearchFor'),
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  run: async (interaction: ChatInputCommandInteraction) => {
    const { localize } = useLocalizedString(interaction.locale);
    if (!interaction.channel) {
      return interaction.reply(localize('channelNotFound'));
    }

    if (!process.env.OPEN_AI_TOKEN) {
      return interaction.reply(localize('commandDisabled'));
    }

    const input = interaction.options.getString('input') ?? '';

    await interaction.deferReply();
    const response = await ask(input, interaction.user.id);
    if (interaction.channel?.type !== ChannelType.GuildText) {
      throw new Error('Channel Type needs to be GuildText');
    }
    return interaction.channel?.send(response ?? localize('global:noResponseFromOpenAI'));
  },
};

export default Ask;
