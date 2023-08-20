import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChatInputCommandInteraction,
  InteractionReplyOptions,
  MessagePayload,
} from 'discord.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { PlayerCommand } from '../../models/discord.js';

import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { LoopOption } from '../../models/commands/loop.js';
import { QueueRepeatMode } from 'discord-player';
import { useDefaultPlayer } from '../../helpers/discord/player.js';
import { logger } from '../../helpers/logger/logger.js';
import { DefaultLoggerMessage } from '../../enums/logger.js';

export const Loop: PlayerCommand = {
  name: localizedString('global:loop'),
  description: localizedString('global:enableDisableLoopDescription'),
  nameLocalizations: getLocalizations('global:loop'),
  descriptionLocalizations: getLocalizations('global:enableDisableLoopDescription'),

  options: [
    {
      name: localizedString('global:action'),
      description: localizedString('global:whatActionToPerform'),
      nameLocalizations: getLocalizations('global:action'),
      descriptionLocalizations: getLocalizations('global:whatActionToPerform'),
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: localizedString('global:queue'), value: LoopOption.EnableLoopQueue },
        { name: localizedString('global:song'), value: LoopOption.EnableLoopSong },
        { name: localizedString('global:disable'), value: LoopOption.DisableLoop },
      ],
    },
  ],
  type: ApplicationCommandType.ChatInput,

  run: async (interaction: ChatInputCommandInteraction) => {
    const sendResponse = async (options: string | MessagePayload | InteractionReplyOptions) => {
      if (interaction.replied) {
        await interaction.followUp(options);
      } else {
        await interaction.reply(options);
      }
    };
    const type = interaction.options.data.map((x) => x.value).toString() as LoopOption;
    const { localize } = useLocalizedString(interaction.locale);
    if (!interaction.guildId) {
      logger(DefaultLoggerMessage.GuildIsNotDefined).error();
      const genericError = localize('global:genericError');
      return sendResponse({
        content: genericError,
        ephemeral: true,
      });
    }
    const player = useDefaultPlayer();
    const queue = player.nodes.get(interaction.guildId);

    if (!queue?.isPlaying()) {
      const noMusicCurrentlyPlaying = localize('global:noMusicCurrentlyPlaying');
      return sendResponse({
        content: noMusicCurrentlyPlaying,
        ephemeral: true,
      });
    }
    const genericError = localize('global:genericError');
    switch (type) {
      case LoopOption.EnableLoopQueue: {
        if (queue.repeatMode === QueueRepeatMode.TRACK) {
          const disableCurrentLoop = localize('global:disableCurrentLoop');

          return sendResponse({
            content: disableCurrentLoop,
            ephemeral: true,
          });
        }

        queue.setRepeatMode(QueueRepeatMode.QUEUE);

        const response = localize('global:songRepeatMode');

        // songRepeatMode
        return sendResponse({
          content: response,
        });
      }
      case LoopOption.DisableLoop: {
        queue.setRepeatMode(QueueRepeatMode.OFF);

        return sendResponse({
          content: localize('global:repeatModeDisabled'),
        });
      }
      case LoopOption.EnableLoopSong: {
        if (queue.repeatMode === QueueRepeatMode.QUEUE) {
          const responsec = localize('global:disableCurrentLoop');
          return sendResponse({
            content: responsec,
            ephemeral: true,
          });
        }

        queue.setRepeatMode(QueueRepeatMode.TRACK);

        const responsec = localize('global:songRepeatMode');

        return sendResponse({
          content: responsec,
        });
      }
      default: {
        return sendResponse({
          content: genericError,
          ephemeral: true,
        });
      }
    }
  },
};

export default Loop;
