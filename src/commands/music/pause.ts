import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { PlayerCommand } from '../../models/discord.js';

import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { ApplicationCommandType, ChatInputCommandInteraction, GuildMember, MessageFlags } from 'discord.js';
import { useDefaultPlayer } from '../../helpers/discord/player.js';
import { logger } from '../../helpers/logger/logger.js';

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
        logger.error('Guild is not defined.');
        return await interaction.reply({
          content: localize('global:genericError'),
          flags: MessageFlags.Ephemeral,
        });
      }
      const player = useDefaultPlayer();
      const queue = player.nodes.get(interaction.guildId);

      if (!queue || !queue.isPlaying()) {
        return await interaction.reply({
          content: localize('global:noMusicCurrentlyPlaying'),
          flags: MessageFlags.Ephemeral,
        });
      }

      const memberChannel = (interaction.member as GuildMember | null)?.voice.channel;
      if (!memberChannel || memberChannel.id !== queue.channel?.id) {
        return await interaction.reply({
          content: localize('global:mustBeInSameVoiceChannel'),
          flags: MessageFlags.Ephemeral,
        });
      }

      if (queue.node.isPaused()) {
        return await interaction.reply({
          content: localize('global:trackIsPaused'),
          flags: MessageFlags.Ephemeral,
        });
      }

      const success = queue.node.pause();

      return await interaction.reply({
        content: success
          ? localize('global:currentTrackPaused', { title: queue.currentTrack?.title })
          : localize('global:failedToPauseQueue', { title: queue.currentTrack?.title }),
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      logger.error(error);
      if (interaction.replied || interaction.deferred) {
        return await interaction.followUp({
          content: localize('global:genericError'),
          flags: MessageFlags.Ephemeral,
        });
      }
      return await interaction.reply({
        content: localize('global:genericError'),
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

export default Pause;
