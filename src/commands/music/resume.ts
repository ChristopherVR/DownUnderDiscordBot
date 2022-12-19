import { ChatInputCommandInteraction, Client } from 'discord.js';
import { PlayerCommand } from '../../types';
import { getPlayer } from '../helpers/player';

export const Resume: PlayerCommand = {
  name: 'resume',
  description: 'play the track',
  voiceChannel: true,
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      console.log('GuildId is undefined');
      return await interaction.reply({
        content: `Unable to handle your request. Please try again later.`,
        ephemeral: true,
      });
    }
    const queue = getPlayer().getQueue(interaction.guildId);

    if (!queue)
      return await interaction.reply({
        content: `No music currently playing ${interaction.member?.user.id ?? ''}... try again ? ❌`,
        ephemeral: true,
      });

    if (!queue.connection.paused)
      return await interaction.reply({
        content: `The track is already running, ${interaction.member?.user.id ?? ''}... try again ? ❌`,
        ephemeral: true,
      });

    const success = queue.setPaused(false);

    return await interaction.reply({
      content: success
        ? `Current music ${queue.current.title} resumed ✅`
        : `Something went wrong ${interaction.member?.user.id ?? ''}... try again ? ❌`,
    });
  },
};

export default Resume;
