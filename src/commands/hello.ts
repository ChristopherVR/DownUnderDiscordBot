import { ApplicationCommandType, Client, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../types';

const Hello: Command<ChatInputCommandInteraction> = {
  name: 'hello',
  description: 'Returns a greeting',
  type: ApplicationCommandType.ChatInput,
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    const content = 'NEIN, NEIN, NEIN, NEIN!';
    await interaction.followUp({
      ephemeral: true,
      content,
    });
  },
};

export default Hello;
