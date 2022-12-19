import { ApplicationCommandType, ChatInputCommandInteraction, Client } from 'discord.js';
import { PlayerCommand } from '../../types';
import { getPlayer } from '../helpers/player';

export const Pause: PlayerCommand = {
  name: 'pause',
  description: 'pause the track',
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

    if (!queue)
      return await interaction.reply({
        content: `No music currently playing ${interaction.member?.user.id ?? ''}... try again ? ❌`,
        ephemeral: true,
      });

    if (queue.connection.paused)
      return await interaction.reply({
        content: 'The track is currently paused!',
        ephemeral: true,
      });

    if (queue.connection.paused)
      return await interaction.reply({
        content: `The track is currently paused, ${interaction.member?.user.id ?? ''}... try again ? ❌`,
        ephemeral: true,
      });

    const success = queue.setPaused(true);

    return await interaction.reply({
      content: success
        ? `Current music ${queue.current.title} paused ✅`
        : `Something went wrong ${interaction.member?.user.id ?? ''}... try again ? ❌`,
    });
  },
};

export default Pause;
