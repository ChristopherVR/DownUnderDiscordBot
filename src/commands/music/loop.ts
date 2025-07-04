import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChatInputCommandInteraction,
  GuildMember,
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
        { name: localizedString('global:autoplay'), value: LoopOption.EnableAutoplay },
      ],
    },
  ],
  type: ApplicationCommandType.ChatInput,

  run: async (interaction: ChatInputCommandInteraction) => {
    const { localize } = useLocalizedString(interaction.locale);
    try {
      if (!interaction.guildId) {
        logger(DefaultLoggerMessage.GuildIsNotDefined).error();
        return await interaction.reply({
          content: localize('global:genericError'),
          ephemeral: true,
        });
      }
      const player = useDefaultPlayer();
      const queue = player.nodes.get(interaction.guildId);

      if (!queue?.isPlaying()) {
        return await interaction.reply({
          content: localize('global:noMusicCurrentlyPlaying'),
          ephemeral: true,
        });
      }

      const memberChannel = (interaction.member as GuildMember | null)?.voice.channel;
      if (!memberChannel || memberChannel.id !== queue.channel?.id) {
        return await interaction.reply({
          content: localize('global:mustBeInSameVoiceChannel'),
          ephemeral: true,
        });
      }

      const type = interaction.options.getString('action', true) as LoopOption;

      let replyMessage = '';

      switch (type) {
        case LoopOption.EnableLoopQueue:
          if (queue.repeatMode === QueueRepeatMode.QUEUE) {
            replyMessage = localize('global:loopAlreadyEnabled');
          } else {
            queue.setRepeatMode(QueueRepeatMode.QUEUE);
            replyMessage = localize('global:queueLoopEnabled');
          }
          break;
        case LoopOption.EnableLoopSong:
          if (queue.repeatMode === QueueRepeatMode.TRACK) {
            replyMessage = localize('global:loopAlreadyEnabled');
          } else {
            queue.setRepeatMode(QueueRepeatMode.TRACK);
            replyMessage = localize('global:songLoopEnabled');
          }
          break;
        case LoopOption.DisableLoop:
          if (queue.repeatMode === QueueRepeatMode.OFF) {
            replyMessage = localize('global:loopAlreadyDisabled');
          } else {
            queue.setRepeatMode(QueueRepeatMode.OFF);
            replyMessage = localize('global:loopDisabled');
          }
          break;
        case LoopOption.EnableAutoplay:
          if (queue.repeatMode === QueueRepeatMode.AUTOPLAY) {
            replyMessage = localize('global:autoplayAlreadyEnabled');
          } else {
            queue.setRepeatMode(QueueRepeatMode.AUTOPLAY);
            replyMessage = localize('global:autoplayEnabled');
          }
          break;
        default:
          return await interaction.reply({
            content: localize('global:genericError'),
            ephemeral: true,
          });
      }

      return await interaction.reply({
        content: replyMessage,
      });
    } catch (error) {
      if (error instanceof Error) {
        logger(error).error();
      } else {
        logger(String(error)).error();
      }
      await interaction.reply({
        content: localize('global:genericError'),
        ephemeral: true,
      });
    }
  },
};

export default Loop;
