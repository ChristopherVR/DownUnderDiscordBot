import { QueryType } from 'discord-player';
import { ApplicationCommandOptionType, ChatInputCommandInteraction, Client, User } from 'discord.js';
import { PlayerCommand } from '../../types';
import { getPlayer } from '../helpers/player';

export const PlayNext: PlayerCommand = {
  name: 'playnext',
  description: 'song you want to playnext',
  voiceChannel: true,
  options: [
    {
      name: 'song',
      description: 'the song you want to playnext',
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
    await interaction.deferReply();
    const queue = getPlayer().getQueue(interaction.guildId);

    if (!queue?.playing)
      return await interaction.editReply({
        content: `No music currently playing ${interaction.member?.user.id ?? ''}... try again ? ❌`,
        // ephemeral: true,
      });

    const song = interaction.options.getString('song') ?? '';

    const res = await getPlayer().search(song, {
      requestedBy: interaction.member as unknown as User,
      searchEngine: QueryType.AUTO,
    });

    if (!res?.tracks?.length)
      return await interaction.editReply({
        content: `No results found ${interaction.member?.user.id ?? ''}... try again ? ❌`,
        // ephemeral: true,
      });

    if (res.playlist)
      return await interaction.editReply({
        content: `This command dose not support playlist's ${interaction.member?.user.id ?? ''}... try again ? ❌`,
        // ephemeral: true,
      });

    queue.insert(res.tracks[0], 0);

    return await interaction.editReply({
      content: `Track has been inserted into the queue... it will play next 🎧`,
    });
  },
};

export default PlayNext;
