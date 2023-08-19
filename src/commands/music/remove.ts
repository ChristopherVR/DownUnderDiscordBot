import { ApplicationCommandOptionType, ChatInputCommandInteraction } from 'discord.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { PlayerCommand } from '../../models/discord.js';

import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { useDefaultPlayer } from '../../helpers/discord/player.js';
import { logger } from '../../helpers/logger/logger.js';
import { DefaultLoggerMessage } from '../../constants/logger.js';

export const Remove: PlayerCommand = {
  name: localizedString('global:remove'),
  description: localizedString('global:removeSongFromQueue'),
  nameLocalizations: getLocalizations('global:remove'),
  descriptionLocalizations: getLocalizations('global:removeSongFromQueue'),

  options: [
    {
      name: localizedString('global:song'),
      description: localizedString('global:nameUrlToRemoveFromQueue'),
      nameLocalizations: getLocalizations('global:song'),
      descriptionLocalizations: getLocalizations('global:nameUrlToRemoveFromQueue'),
      type: ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: localizedString('global:number'),
      description: localizedString('global:placeSongIsInQueue'),
      nameLocalizations: getLocalizations('global:number'),
      descriptionLocalizations: getLocalizations('global:placeSongIsInQueue'),
      type: ApplicationCommandOptionType.Number,
      required: false,
    },
  ],
  run: async (interaction: ChatInputCommandInteraction) => {
    const { localize } = useLocalizedString(interaction.locale);
    const genericError = localize('global:genericError');
    if (!interaction.guildId) {
      logger(DefaultLoggerMessage.GuildIsNotDefined).error();
      return await interaction.reply({
        content: genericError,
        ephemeral: true,
      });
    }
    const number = interaction.options.getNumber('number');
    const track = interaction.options.getString('song');
    const player = await useDefaultPlayer();
    const queue = player.nodes.get(interaction.guildId);

    if (!queue?.isPlaying()) {
      const noMusicCurrentlyPlaying = localize('global:noMusicCurrentlyPlaying');
      return await interaction.reply({
        content: noMusicCurrentlyPlaying,
        ephemeral: true,
      });
    }

    if (!track && !number) {
      const useValidOptionToRemoveSong = localize('global:useValidOptionToRemoveSong');
      return await interaction.reply({
        content: useValidOptionToRemoveSong,
        ephemeral: true,
      });
    }

    if (track) {
      // eslint-disable-next-line no-restricted-syntax
      for (const song of queue.tracks.data) {
        if (song.title === track || song.url === track) {
          const removedSongFromQueue = localize('global:removedSongFromQueue', {
            lng: interaction.locale,
            track,
          });
          queue.removeTrack(song);
          return interaction.reply({
            content: removedSongFromQueue,
          });
        }
      }

      const couldNotFindTrack = localize('global:couldNotFindTrack', {
        lng: interaction.locale,
        track,
      });
      return await interaction.reply({
        content: couldNotFindTrack,
        ephemeral: true,
      });
    }

    if (number) {
      const index = number - 1;
      const trackname = queue.tracks[index].title;

      if (!trackname) {
        const trackDoesNotExist = localize('global:trackDoesNotExist', {
          lng: interaction.locale,
          track,
        });
        return await interaction.reply({
          content: trackDoesNotExist,
          ephemeral: true,
        });
      }

      queue.removeTrack(index);
      const removedSongFromQueue = localize('global:removedSongFromQueue', {
        lng: interaction.locale,
        track,
      });
      return await interaction.reply({
        content: removedSongFromQueue,
      });
    }

    return await interaction.reply({ content: genericError });
  },
};

export default Remove;
