import {
  ApplicationCommandType,
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
  ChannelType,
} from 'discord.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { aiHelper } from '../../helpers/openai/ai.js';
import { Command } from '../../models/discord.js';
import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { logger } from '../../helpers/logger/logger.js';

export const Ask: Command<ChatInputCommandInteraction> = {
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

    try {
      const shouldClear = interaction.options.getBoolean('clear');
      const prompt = interaction.options.getString('prompt');
      const userId = interaction.user.id;

      if (shouldClear) {
        aiHelper.clearHistory(userId);
        return await interaction.reply({ content: 'Conversation history cleared.', ephemeral: true });
      }

      if (!prompt) {
        return await interaction.reply({ content: 'You must provide a prompt.', ephemeral: true });
      }

      await interaction.deferReply();

      const response = await aiHelper.ask(prompt, userId);

      await interaction.followUp(response ?? 'No response from AI.');
    } catch (error) {
      logger.error({ err: error }, 'Error in ask command');
      await interaction.followUp({ content: localize('global:genericError'), ephemeral: true });
    }
  },
};

export default Ask;
