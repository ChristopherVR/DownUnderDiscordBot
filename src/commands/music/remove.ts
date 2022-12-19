import { ApplicationCommandOptionType, ChatInputCommandInteraction, Client } from 'discord.js';
import { PlayerCommand } from '../../types';
import { getPlayer } from '../helpers/player';

export const Remove: PlayerCommand = {
  name: 'remove',
  description: 'remove a song from the queue',
  voiceChannel: true,
  options: [
    {
      name: 'song',
      description: 'the name/url of the track you want to remove',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: 'number',
      description: 'the place in the queue the song is in',
      type: ApplicationCommandOptionType.Number,
      required: false,
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
    const number = interaction.options.getNumber('number');
    const track = interaction.options.getString('song');

    const queue = getPlayer().getQueue(interaction.guildId);

    if (!queue?.playing)
      return await interaction.reply({
        content: `No music currently playing ${interaction.member?.user.id ?? ''}... try again ? ❌`,
        ephemeral: true,
      });
    if (!track && !number)
      await interaction.reply({
        content: `You have to use one of the options to remove a song ${
          interaction.member?.user.id ?? ''
        }... try again ? ❌`,
        ephemeral: true,
      });

    if (track) {
      // eslint-disable-next-line no-restricted-syntax
      for (const song of queue.tracks) {
        if (song.title === track || song.url === track) {
          queue.remove(song);
          return interaction.reply({
            content: `removed ${track} from the queue ✅`,
          });
        }
      }

      return await interaction.reply({
        content: `could not find ${track} ${
          interaction.member?.user.id ?? ''
        }... try using the url or the full name of the song ? ❌`,
        ephemeral: true,
      });
    }

    if (number) {
      const index = number - 1;
      const trackname = queue.tracks[index].title;

      if (!trackname)
        return await interaction.reply({
          content: `This track dose not seem to exist ${interaction.member?.user.id ?? ''}...  try again ?❌`,
          ephemeral: true,
        });

      queue.remove(index);

      return await interaction.reply({
        content: `removed ${trackname} from the queue ✅`,
      });
    }

    return await interaction.reply({ content: 'Unable to process this request... try again later.' });
  },
};

export default Remove;
