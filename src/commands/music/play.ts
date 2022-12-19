import { QueryType } from 'discord-player';
import { ApplicationCommandOptionType, ChatInputCommandInteraction, User } from 'discord.js';
import { ClientExtended, PlayerCommand } from '../../types';
import { getPlayer } from '../helpers/player';

export const Play: PlayerCommand = {
  name: 'play',
  description: 'play a song!',
  voiceChannel: true,
  options: [
    {
      name: 'song',
      description: 'the song you want to play',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  // eslint-disable-next-line consistent-return
  run: async (client: ClientExtended, interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      console.log('GuildId is undefined');
      return await interaction.reply({
        content: `Unable to handle your request. Please try again later.`,
        ephemeral: true,
      });
    }
    await interaction.deferReply();
    const song = interaction.options.getString('song') ?? '';
    const res = await getPlayer().search(song, {
      requestedBy: interaction.member?.user as User,
      searchEngine: QueryType.AUTO,
    });

    if (!res?.tracks?.length)
      return await interaction.editReply({
        content: `No results found ${interaction.member?.user.id ?? ''}... try again ? ❌`,
        // ephemeral: true,
      });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const queue = getPlayer().createQueue(interaction.guild!, {
      metadata: interaction.channel,
      spotifyBridge: true,
      initialVolume: 50,
      leaveOnEnd: false, // Don't leave automatically.
    });

    try {
      if (!queue.connection) {
        const userId = interaction.member?.user.id;
        if (!userId) {
          console.log('UserId is undefined');
          return await interaction.reply({
            content: `Unable to handle your request. Please try again later.`,
            ephemeral: true,
          });
        }
        const channel = interaction.guild?.members.cache.get(userId)?.voice.channel;

        if (!channel) {
          console.log('GuildId is undefined');
          return await interaction.reply({
            content: `Unable to handle your request. Please try again later.`,
            ephemeral: true,
          });
        }
        await queue.connect(channel);
      }
    } catch {
      getPlayer().deleteQueue(interaction.guildId);
      return await interaction.editReply({
        content: `I can't join the voice channel ${interaction.member?.user.id ?? ''}... try again ? ❌`,
        // ephemeral: true,
      });
    }

    interaction.editReply({
      content: `Loading your ${res.playlist ? 'playlist' : 'track'}... 🎧`,
    });

    if (res.playlist) {
      queue.addTracks(res.tracks);
    } else {
      queue.addTrack(res.tracks[0]);
    }

    if (!queue.playing) await queue.play();
  },
};

export default Play;
