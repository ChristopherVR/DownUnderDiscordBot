import { QueryType } from 'discord-player';
import { ApplicationCommandOptionType, ChatInputCommandInteraction, User } from 'discord.js';
import { localizedString } from '../../i18n';
import { PlayerCommand } from '../../types';
import cast from '../helpers/cast';

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
    const queue = global.player.getQueue(interaction.guildId);

    if (!queue?.playing) {
      const loc = localizedString('global:noMusicCurrentlyPlaying', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: loc,
        ephemeral: true,
      });
    }

    const song = interaction.options.getString('song') ?? '';

    const res = await global.player.search(song, {
      requestedBy: cast<User>(interaction.member),
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

    queue.insert(res.tracks[0], 0);
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
