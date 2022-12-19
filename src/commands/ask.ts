import { ApplicationCommandType, Client, ChatInputCommandInteraction, ApplicationCommandOptionType } from 'discord.js';
import { ask } from '../openai/ai';
import { Command } from '../types';

export const Ask: Command<ChatInputCommandInteraction> = {
  name: 'ask',
  description: 'Returns a response using OpenAI',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'input',
      description: 'The text to search for',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    console.log(interaction);
    const input = interaction.options.getString('input') ?? '';
    const answer = (await ask(input)) ?? ''; // prompt GPT-3
    await interaction.channel?.send(answer);
  },
};

export default Ask;
