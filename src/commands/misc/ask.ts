import {
  ApplicationCommandType,
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
  ChannelType,
  MessageFlags,
} from 'discord.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { aiHelper } from '../../helpers/openai/ai.js';
import { Command } from '../../models/discord.js';
import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { logger } from '../../helpers/logger/logger.js';

export const Ask = (): Command<ChatInputCommandInteraction> => ({
  name: localizedString('global:ask'),
  nameLocalizations: getLocalizations('global:ask'),
  description: localizedString('global:askAi'),
  descriptionLocalizations: getLocalizations('global:askAi'),
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'prompt',
      description: 'The question to ask the AI',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: 'clear',
      description: 'Clear the conversation history',
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
  ],
  run: async (interaction: ChatInputCommandInteraction) => {
    const { localize } = useLocalizedString(interaction.locale);
    if (!interaction.deferred) {
      await interaction.deferReply();
    }

    try {
      const shouldClear = interaction.options.getBoolean('clear');
      const prompt = interaction.options.getString('prompt');
      const userId = interaction.user.id;

      if (shouldClear) {
        aiHelper.clearHistory(userId);
        return await interaction.editReply({ content: localize('global:conversationHistoryCleared') });
      }

      if (!prompt) {
        return await interaction.editReply({ content: localize('global:mustProvidePrompt') });
      }

      const response = await aiHelper.ask(prompt, userId);

      await interaction.followUp(response ?? localize('global:noResponseFromAI'));
    } catch (error) {
      logger.error({ err: error }, 'Error in ask command');
      if (!(error as any).message.includes('ephemeral')) {
        await interaction.followUp({ content: localize('global:genericError'), flags: MessageFlags.Ephemeral });
      }
    }
  },
});

export default Ask;
