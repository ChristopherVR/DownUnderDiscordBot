import { ApplicationCommandType, Client, ChatInputCommandInteraction } from 'discord.js';
import { ask } from '../openai/ai';
import { Command } from '../types';

export const Ask: Command<ChatInputCommandInteraction> = {
  name: 'ask',
  description: 'Returns a response using OpenAI',
  type: ApplicationCommandType.ChatInput,
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    const answer = (await ask(interaction.options.data[0].value?.toString())) ?? ''; // prompt GPT-3
    await interaction.channel?.send(answer);
  },
};

export default Ask;
