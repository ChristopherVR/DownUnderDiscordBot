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

type UserId = number | string;
type ConversationId = number | string | undefined;

const conversations = new Map<UserId, ConversationId>();

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
      await interaction.followUp(localize('channelNotFound'));
    }

    if (!process.env.OPEN_AI_TOKEN) {
      await interaction.followUp(localize('commandDisabled'));
    }

    const input = interaction.options.getString('input') ?? '';

    const userConversation = conversations.get(interaction.user.id);

    const response = await ask(input, userConversation);
    if (interaction.channel?.type !== ChannelType.GuildText) {
      throw new Error('Channel Type needs to be GuildText');
    }

    conversations.set(interaction.user.id, response.conversationId);
    await interaction.channel?.send(response.answer ?? '');
  },
};

export default Ask;
