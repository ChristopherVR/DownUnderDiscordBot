import { ApplicationCommandType, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { PlayerCommand } from '../../models/discord.js';

import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { useDefaultPlayer } from '../../helpers/discord/player.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { logger } from '../../helpers/logger/logger.js';
import { DefaultLoggerMessage } from '../../enums/logger.js';

export const Back: PlayerCommand = {
  name: localizedString('global:back'),
  description: localizedString('global:backToPreviousSong'),
  nameLocalizations: getLocalizations('global:back'),
  descriptionLocalizations: getLocalizations('global:backToPreviousSong'),

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

      if (!queue.history.previousTrack) {
        return await interaction.reply({
          content: localize('global:noMusicPlayedPreviously'),
          ephemeral: true,
        });
      }

      await queue.history.back();
      await interaction.reply({ content: localize('global:playingPreviousTrack') });
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

export default Back;
