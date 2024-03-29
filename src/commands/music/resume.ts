import { ChatInputCommandInteraction } from 'discord.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { PlayerCommand } from '../../models/discord.js';

import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { useDefaultPlayer } from '../../helpers/discord/player.js';
import { logger } from '../../helpers/logger/logger.js';
import { DefaultLoggerMessage } from '../../enums/logger.js';

export const Resume: PlayerCommand = {
  name: localizedString('global:resume'),
  description: localizedString('global:playTheTrack'),
  nameLocalizations: getLocalizations('global:resume'),
  descriptionLocalizations: getLocalizations('global:playTheTrack'),

  run: async (interaction: ChatInputCommandInteraction) => {
    const { localize } = useLocalizedString(interaction.locale);
    const genericError = localize('global:genericError');
    if (!interaction.guildId) {
      logger(DefaultLoggerMessage.GuildIsNotDefined).error();
      return interaction.reply({
        content: genericError,
        ephemeral: true,
      });
    }
    const player = useDefaultPlayer();
    const queue = player.nodes.get(interaction.guildId);

    if (!queue) {
      const response = localize('global:noMusicCurrentlyPlaying');
      return interaction.reply({
        content: response,
        ephemeral: true,
      });
    }

    if (!queue.node.isPaused()) {
      const trackAlreadyRunning = localize('global:trackAlreadyRunning');
      return interaction.reply({
        content: trackAlreadyRunning,
        ephemeral: true,
      });
    }

    const success = queue.node.setPaused(false);

    const currentMusicResumed = localize('global:currentMusicResumed', {
      lng: interaction.locale,
      title: queue.currentTrack?.title,
    });

    return interaction.reply({
      content: success ? currentMusicResumed : genericError,
    });
  },
};

export default Resume;
