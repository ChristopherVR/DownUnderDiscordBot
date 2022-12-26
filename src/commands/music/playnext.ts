import { QueryType } from 'discord-player';
import { ApplicationCommandOptionType, ChatInputCommandInteraction, User } from 'discord.js';
import { localizedString } from '../../i18n';
import { PlayerCommand } from '../../types';
import { getPlayer } from '../helpers/player';
import getLocalizations from '../i18n/discordLocalization';

export const PlayNext: PlayerCommand = {
  name: localizedString('global:playnext'),
  description: localizedString('global:songToPlayNext'),
  nameLocalizations: getLocalizations('global:playnext'),
  descriptionLocalizations: getLocalizations('global:songToPlayNext'),
  voiceChannel: true,
  options: [
    {
      name: localizedString('global:playnext'),
      description: localizedString('global:songToPlayNext'),
      nameLocalizations: getLocalizations('global:playnext'),
      descriptionLocalizations: getLocalizations('global:songToPlayNext'),
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  run: async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      const genericError = localizedString('global:genericError', {
        lng: interaction.locale,
      });
      console.log('GuildId is undefined');
      return await interaction.reply({
        content: genericError,
        ephemeral: true,
      });
    }
    const queue = getPlayer().getQueue(interaction.guildId);

    if (!queue?.playing) {
      const loc = localizedString('global:noMusicCurrentlyPlaying', {
        lng: interaction.locale,
      });
      return await interaction.editReply({
        content: loc,
      });
    }

    const song = interaction.options.getString('song') ?? '';

    const res = await getPlayer().search(song, {
      requestedBy: interaction.member as unknown as User,
      searchEngine: QueryType.AUTO,
    });

    if (!res?.tracks?.length) {
      const noResultsFound = localizedString('global:noResultsFound', {
        lng: interaction.locale,
      });
      return await interaction.editReply({
        content: noResultsFound,
      });
    }

    if (res.playlist) {
      const playlistsNotSupported = localizedString('global:playlistsNotSupported', {
        lng: interaction.locale,
      });
      return await interaction.editReply({
        content: playlistsNotSupported,
      });
    }

    queue.insert(res.tracks[0], 0);
    const trackInsertedIntoQueue = localizedString('global:trackInsertedIntoQueue', {
      lng: interaction.locale,
    });
    return await interaction.editReply({
      content: trackInsertedIntoQueue,
    });
  },
};

export default PlayNext;
