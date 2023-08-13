import { ApplicationCommandType, ChatInputCommandInteraction } from 'discord.js';
import { PlayerCommand } from '../../models/discord.js';

import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { useDefaultPlayer } from '../../helpers/discord/player.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { logger, DefaultLoggerMessage } from '../../helpers/logger/logger.js';

export const Back: PlayerCommand = {
  name: localizedString('global:back'),
  description: localizedString('global:backToPreviousSong'),
  nameLocalizations: getLocalizations('global:back'),
  descriptionLocalizations: getLocalizations('global:backToPreviousSong'),

  type: ApplicationCommandType.ChatInput,
  run: async (interaction: ChatInputCommandInteraction) => {
    const { localize } = useLocalizedString(interaction.locale);
    if (!interaction.guildId) {
      logger(DefaultLoggerMessage.GuildIsNotDefined).error();
      return await interaction.reply({
        content: localize('global:genericError', {
          lng: interaction.locale,
          ephemeral: true,
        }),
      });
    }

    const player = await useDefaultPlayer();
    const queue = player.nodes.get(interaction.guildId);

    if (!queue?.isPlaying()) {
      const response = localize('global:noMusicCurrentlyPlaying');
      return await interaction.reply({
        content: response,
        ephemeral: true,
      });
    }

    if (!queue.history.previousTrack) {
      const response = localize('global:noMusicPlayedPreviously');
      return await interaction.reply({
        content: response,
        ephemeral: true,
      });
    }

    await queue.history.back();
    const response = localize('global:playingPreviousTrack');
    return await interaction.reply({ content: response });
  },
};

export default Back;
