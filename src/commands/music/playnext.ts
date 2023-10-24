import { QueryType } from 'discord-player';
import { ApplicationCommandOptionType, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { PlayerCommand } from '../../models/discord.js';

import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { useDefaultPlayer } from '../../helpers/discord/player.js';
import { logger } from '../../helpers/logger/logger.js';
import { DefaultLoggerMessage } from '../../enums/logger.js';

export const PlayNext: PlayerCommand = {
  name: localizedString('global:playnext'),
  description: localizedString('global:songToPlayNext'),
  nameLocalizations: getLocalizations('global:playnext'),
  descriptionLocalizations: getLocalizations('global:songToPlayNext'),

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
    const { localize } = useLocalizedString(interaction.locale);
    if (!interaction.guildId) {
      const genericError = localize('global:genericError');
      logger(DefaultLoggerMessage.GuildIsNotDefined).error();
      return interaction.reply({
        content: genericError,
        ephemeral: true,
      });
    }
    const player = useDefaultPlayer();
    const queue = player.nodes.get(interaction.guildId);

    if (!queue?.isPlaying()) {
      const response = localize('global:noMusicCurrentlyPlaying');
      return interaction.reply({
        content: response,
        ephemeral: true,
      });
    }

    const song = interaction.options.getString('song') ?? '';
    await interaction.deferReply();
    const res = await player.search(song, {
      requestedBy: interaction.member as GuildMember,
      searchEngine: QueryType.AUTO,
    });

    if (!res.tracks.length) {
      const noResultsFound = localize('global:noTracksFoundQueue');
      return interaction.followUp({
        content: noResultsFound,
        ephemeral: true,
      });
    }

    if (res.playlist) {
      const playlistsNotSupported = localize('global:playlistsNotSupported');
      return interaction.followUp({
        content: playlistsNotSupported,
        ephemeral: true,
      });
    }

    queue.insertTrack(res.tracks[0], 0);
    const trackInsertedIntoQueue = localize('global:trackInsertedIntoQueue');
    return interaction.followUp({
      content: trackInsertedIntoQueue,
      ephemeral: true,
    });
  },
};

export default PlayNext;
