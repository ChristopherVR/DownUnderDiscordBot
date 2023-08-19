import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from 'discord.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { PlayerCommand } from '../../models/discord.js';

import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { useDefaultPlayer } from '../../helpers/discord/player.js';
import { logger } from '../../helpers/logger/logger.js';
import { DefaultLoggerMessage } from '../../enums/logger.js';

export const Jump: PlayerCommand = {
  name: localizedString('global:jump'),
  description: localizedString('global:jumpDesc'),
  nameLocalizations: getLocalizations('global:jump'),
  descriptionLocalizations: getLocalizations('global:jumpDesc'),
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
  type: ApplicationCommandType.ChatInput,
  run: async (interaction: ChatInputCommandInteraction) => {
    const track = interaction.options.getString('song');
    const number = interaction.options.getNumber('number');
    const { localize } = useLocalizedString(interaction.locale);
    if (!interaction.guildId) {
      const genericError = localize('global:genericError');
      logger(DefaultLoggerMessage.GuildIsNotDefined).error();
      return await interaction.reply({
        content: genericError,
        ephemeral: true,
      });
    }
    const player = await useDefaultPlayer();
    const queue = player.nodes.get(interaction.guildId);

    if (!queue?.isPlaying()) {
      const response = localize('global:noMusicCurrentlyPlaying');
      return await interaction.reply({
        content: response,
      });
    }

    if (!track && !number) {
      const response = localize('global:haveToUseOneOfTheOptions');
      return await interaction.reply({
        content: response,
        ephemeral: true,
      });
    }

    if (track) {
      for (const song of queue.tracks.data) {
        if (song.title === track || song.url === track) {
          queue.node.skipTo(song);

          const response = localize('global:skippedTo', {
            lng: interaction.locale,
            track,
          });
          return await interaction.reply({ content: response });
        }
      }

      const response = localize('global:couldNotFindTrack', {
        lng: interaction.locale,
        track,
      });

      return await interaction.reply({
        content: response,
        ephemeral: true,
      });
    }

    const index = number! - 1;
    const trackname = queue.tracks[index].title;
    if (!trackname) {
      const response = localize('global:trackDoesNotExist');
      return await interaction.reply({
        content: response,
        ephemeral: true,
      });
    }

    queue.node.skipTo(index);
    const response = localize('global:jumpedTo', {
      lng: interaction.locale,
      track: trackname,
    });

    await interaction.reply({ content: response });
  },
};

export default Jump;
