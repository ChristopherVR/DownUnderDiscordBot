import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { PlayerCommand } from '../../models/discord.js';

import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { ApplicationCommandType, ChatInputCommandInteraction, GuildMember } from 'discord.js';
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

      if (!queue || !queue.isPlaying()) {
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

      if (queue.node.isPaused()) {
        return await interaction.reply({
          content: localize('global:trackIsPaused'),
          ephemeral: true,
        });
      }

      const success = queue.node.pause();

      return await interaction.reply({
        content: success
          ? localize('global:currentTrackPaused', { title: queue.currentTrack?.title })
          : localize('global:failedToPauseQueue', { title: queue.currentTrack?.title }),
        ephemeral: !success,
      });
    } catch (error) {
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

export default Pause;
