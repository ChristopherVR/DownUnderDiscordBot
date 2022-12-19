import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, Client } from 'discord.js';
import { PlayerCommand } from '../../types';
import { getPlayer } from '../helpers/player';

export const Jump: PlayerCommand = {
  name: 'jump',
  description: 'Jumps to particular track in queue',
  voiceChannel: true,
  options: [
    {
      name: 'song',
      description: 'the name/url of the track you want to jump to',
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
  type: ApplicationCommandType.ChatInput,
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    const track = interaction.options.getString('song');
    const number = interaction.options.getNumber('number');
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
    if (!track && !number)
      await interaction.reply({
        content: `You have to use one of the options to jump to a song ${
          interaction.member?.user.id ?? ''
        }... try again ? ❌`,
        ephemeral: true,
      });

    if (track) {
      // eslint-disable-next-line no-restricted-syntax
      for (const song of queue.tracks) {
        if (song.title === track || song.url === track) {
          queue.skipTo(song);
          return interaction.reply({ content: `skiped to ${track} ✅` });
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
          content: `This track does not seem to exist ${interaction.member?.user.id ?? ''}...  try again ?❌`,
          ephemeral: true,
        });
      queue.skipTo(index);
      return await interaction.reply({ content: `Jumped to ${trackname}  ✅` });
    }

    return await interaction.reply({ content: 'Unable to process this request... try again later.' });
  },
};

export default Jump;
