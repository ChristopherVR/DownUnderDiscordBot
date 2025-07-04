import { ApplicationCommandOptionType, ChatInputCommandInteraction, GuildMember } from 'discord.js';
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
    try {
      if (!interaction.guildId || !interaction.guild) {
        logger(DefaultLoggerMessage.GuildIsNotDefined).error();
        return await interaction.reply({
          content: localize('global:genericError'),
          ephemeral: true,
        });
      }
      const player = useDefaultPlayer();
      const queue = player.nodes.get(interaction.guildId);

      if (!queue?.isPlaying() || !queue.currentTrack) {
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

      const timeToMS = ms(interaction.options.getString('time', true));

      if (timeToMS >= queue.currentTrack.durationMS) {
        return await interaction.reply({
          content: `${localize('global:indicatedTimeIsTooHigh')}\n${localize('global:validSkipHint')}`,
          ephemeral: true,
        });
      }

      await queue.node.seek(timeToMS);

      return await interaction.reply({
        content: localize('global:timeSetInCurrentTrack', {
          time: timeToMS,
        }),
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid time value')) {
        return await interaction.reply({
          content: localize('global:invalidMsFormat'),
          ephemeral: true,
        });
      }

      if (error instanceof Error) {
        logger(error).error();
      } else {
        logger(String(error)).error();
      }

      if (interaction.replied || interaction.deferred) {
        return await interaction.followUp({
          content: localize('global:genericError'),
          ephemeral: true,
        });
      }
      return await interaction.reply({
        content: localize('global:genericError'),
        ephemeral: true,
      });
    }
  },
};

export default Seek;
