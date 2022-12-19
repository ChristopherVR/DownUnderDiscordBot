import { ApplicationCommandOptionType, ChatInputCommandInteraction, Client } from 'discord.js';
import { PlayerCommand } from '../../types';
import { ms } from '../helpers/ms';
import { getPlayer } from '../helpers/player';

export const Seek: PlayerCommand = {
  name: 'seek',
  description: 'skip back or foward in a song',
  voiceChannel: true,
  options: [
    {
      name: 'time',
      description: 'time that you want to skip to',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
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
        content: `No music currently playing... try again ? ❌`,
        ephemeral: true,
      });

    const timeToMS = ms(interaction.options.getString('time'));

    if (timeToMS >= queue.current.durationMS)
      return await interaction.reply({
        content: `The indicated time is higher than the total time of the current song ${
          interaction.member?.user.id ?? ''
        }... try again ? ❌\n*Try for example a valid time like **5s, 10s, 20 seconds, 1m**...*`,
        ephemeral: true,
      });

    await queue.seek(timeToMS);

    const longMs = ms(timeToMS, {
      long: true,
    });
    return await interaction.reply({
      content: `Time set on the current song **${longMs}** ✅`,
    });
  },
};

export default Seek;
