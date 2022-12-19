import { ApplicationCommandType, ChatInputCommandInteraction, Client } from 'discord.js';
import { PlayerCommand } from '../../types';
import { getPlayer } from '../helpers/player';

export const Clear: PlayerCommand = {
  name: 'clear',
  description: 'clear all the music in the queue',
  voiceChannel: true,
  type: ApplicationCommandType.ChatInput,
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      console.log('GuildId is undefined');
      return await interaction.reply({
        content: `Unable to handle your request. Please try again later.`,
        ephemeral: true,
      });
    }

    const queue = getPlayer().getQueue(interaction.guildId);

    if (!queue?.playing)
      return await interaction.reply({
        content: `No music currently playing ${interaction.member?.user.id ?? ''}... try again ? ❌`,
        ephemeral: true,
      });

    if (!queue.tracks[0])
      return await interaction.reply({
        content: `No music in the queue after the current one ${interaction.member?.user.id ?? ''}... try again ? ❌`,
        ephemeral: true,
      });

    queue.clear();

    return await interaction.reply(`The queue has just been cleared 🗑️`);
  },
};

export default Clear;
