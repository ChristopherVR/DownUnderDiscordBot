import { QueryType } from 'discord-player';
import { ApplicationCommandOptionType, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { localizedString } from '../../helpers/localization';
import { PlayerCommand } from '../../types';

import getLocalizations from '../../helpers/multiMapLocalization';
import { useDefaultPlayer } from '../../helpers/discord';

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
    const player = useDefaultPlayer();
    const queue = player.nodes.get(interaction.guildId);

    if (!queue?.isPlaying()) {
      const loc = localizedString('global:noMusicCurrentlyPlaying', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: loc,
        ephemeral: true,
      });
    }

    const song = interaction.options.getString('song') ?? '';

    const res = await player.search(song, {
      requestedBy: interaction.member as GuildMember,
      searchEngine: QueryType.AUTO,
    });

    if (!res?.tracks?.length) {
      const noResultsFound = localizedString('global:noTracksFoundQueue', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: noResultsFound,
        ephemeral: true,
      });
    }

    if (res.playlist) {
      const playlistsNotSupported = localizedString('global:playlistsNotSupported', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: playlistsNotSupported,
        ephemeral: true,
      });
    }

    queue.insertTrack(res.tracks[0], 0);
    const trackInsertedIntoQueue = localizedString('global:trackInsertedIntoQueue', {
      lng: interaction.locale,
    });
    return await interaction.reply({
      content: trackInsertedIntoQueue,
      ephemeral: true,
    });
  },
};

export default PlayNext;
