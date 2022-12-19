import { ChatInputCommandInteraction, Client } from 'discord.js';
import { PlayerCommand } from '../../types';
import { getPlayer } from '../helpers/player';

export const Shuffle: PlayerCommand = {
  name: 'shuffle',
  description: 'shuffle the track',
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

    queue.shuffle();

    return await interaction.reply({
      content: `Queue shuffled **${queue.tracks.length}** song(s) ! ✅`,
    });
  },
};

export default Shuffle;
