import { ChatInputCommandInteraction } from 'discord.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { PlayerCommand } from '../../models/discord.js';

import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { useDefaultPlayer } from '../../helpers/discord/player.js';
import { logger } from '../../helpers/logger/logger.js';
import { DefaultLoggerMessage } from '../../enums/logger.js';
import { GuildMember } from 'discord.js';

export const Resume: PlayerCommand = {
  name: localizedString('global:resume'),
  description: localizedString('global:playTheTrack'),
  nameLocalizations: getLocalizations('global:resume'),
  descriptionLocalizations: getLocalizations('global:playTheTrack'),

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

      if (!queue.node.isPaused()) {
        return await interaction.reply({
          content: localize('global:trackAlreadyRunning'),
          ephemeral: true,
        });
      }

      const success = queue.node.setPaused(false);

      return await interaction.reply({
        content: success
          ? localize('global:currentMusicResumed', { title: queue.currentTrack?.title })
          : localize('global:genericError'),
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

export default Resume;
