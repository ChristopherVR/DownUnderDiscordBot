import { ApplicationCommandOptionType, ChatInputCommandInteraction } from 'discord.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { PlayerCommand } from '../../models/discord.js';
import { ms } from '../../helpers/time/ms.js';

import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { useDefaultPlayer } from '../../helpers/discord/player.js';
import { logger } from '../../helpers/logger/logger.js';
import { DefaultLoggerMessage } from '../../enums/logger.js';

export const Seek: PlayerCommand = {
  name: localizedString('global:seek'),
  description: localizedString('global:skipBackAndForth'),
  nameLocalizations: getLocalizations('global:seek'),
  descriptionLocalizations: getLocalizations('global:skipBackAndForth'),
  options: [
    {
      name: localizedString('global:time'),
      description: localizedString('global:timeToSkip'),
      nameLocalizations: getLocalizations('global:time'),
      descriptionLocalizations: getLocalizations('global:timeToSkip'),
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
      const noMusicCurrentlyPlaying = localize('global:noMusicCurrentlyPlaying');

      return interaction.reply({
        content: noMusicCurrentlyPlaying,
        ephemeral: true,
      });
    }

    try {
      const timeToMS = ms(interaction.options.getString('time'));

      if (queue.currentTrack?.durationMS !== undefined && timeToMS >= queue.currentTrack.durationMS) {
        const indicatedTimeIsTooHigh = localize('global:indicatedTimeIsTooHigh');
        const validSkipHint = localize('global:validSkipHint');

        return await interaction.reply({
          content: `${indicatedTimeIsTooHigh}\n${validSkipHint}`,
          ephemeral: true,
        });
      }

      await queue.node.seek(timeToMS);
      const timeSetInCurrentTrack = localize('global:timeSetInCurrentTrack', {
        lng: interaction.locale,
        time: timeToMS,
      });

      return await interaction.reply({
        content: timeSetInCurrentTrack,
      });
    } catch {
      const invalidMsFormat = localize('global:invalidMsFormat', {
        lng: interaction.locale,
      });

      return await interaction.reply({
        content: invalidMsFormat,
      });
    }
  },
};

export default Seek;
