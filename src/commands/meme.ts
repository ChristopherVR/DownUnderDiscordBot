import { ApplicationCommandType, Client, CommandInteraction } from 'discord.js';
import { ask } from '../openai/ai';
import { Command } from '../types';

export const Meme: Command<CommandInteraction> = {
  name: 'meme',
  description: 'Returns a response using OpenAI',
  type: ApplicationCommandType.ChatInput,
  run: async (client: Client, interaction: CommandInteraction) => {
    const answer = (await ask(interaction.options.data[0].value?.toString())) ?? ''; // prompt GPT-3
    await interaction.channel?.send(answer);
  },
};

export default Meme;
