import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { PlayerCommand } from '../../models/discord.js';

import getLocalizations from '../../helpers/localization/getLocalizations.js';
import {
  ApplicationCommandType,
  ChatInputCommandInteraction,
  InteractionReplyOptions,
  MessagePayload,
} from 'discord.js';
import { useDefaultPlayer } from '../../helpers/discord/player.js';
import { logger } from '../../helpers/logger/logger.js';
import { DefaultLoggerMessage } from '../../enums/logger.js';

export const Pause: PlayerCommand = {
  name: localizedString('global:pause'),
  description: localizedString('global:pauseTheCurrentTrack'),
  nameLocalizations: getLocalizations('global:pause'),
  descriptionLocalizations: getLocalizations('global:pauseTheCurrentTrack'),
  type: ApplicationCommandType.ChatInput,

  run: async (interaction: ChatInputCommandInteraction) => {
    const sendResponse = async (options: string | MessagePayload | InteractionReplyOptions) => {
      if (interaction.replied) {
        await interaction.followUp(options);
      } else {
        await interaction.reply(options);
      }
    };

    const { localize } = useLocalizedString(interaction.locale);
    if (!interaction.guildId) {
      const genericError = localize('global:genericError', {
        lng: interaction.locale,
      });
      logger(DefaultLoggerMessage.GuildIsNotDefined).error();
      return sendResponse({
        content: genericError,
        ephemeral: true,
      });
    }
    const player = useDefaultPlayer();
    const queue = player.nodes.get(interaction.guildId);

    if (!queue) {
      const noMusicLoc = localize('global:noMusicCurrentlyPlaying', {
        lng: interaction.locale,
      });

      return sendResponse({
        content: noMusicLoc,
        ephemeral: true,
      });
    }

    if (queue.node.isPaused()) {
      const trackIsPaused = localize('global:trackIsPaused', {
        lng: interaction.locale,
      });
      return sendResponse({
        content: trackIsPaused,
        ephemeral: true,
      });
    }

    const success = queue.node.pause();

    const response = localize('global:currentTrackPaused', {
      lng: interaction.locale,
      title: queue.currentTrack?.title,
    });

    const genericError = localize('global:failedToPauseQueue', {
      lng: interaction.locale,
      title: queue.currentTrack?.title,
    });
    return sendResponse({
      content: success ? response : genericError,
      ephemeral: !success,
    });
  },
};

export default Pause;
