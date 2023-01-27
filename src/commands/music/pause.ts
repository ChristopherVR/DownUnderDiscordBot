import { ApplicationCommandType, ChatInputCommandInteraction } from 'discord.js';
import { localizedString } from '../../i18n';
import { PlayerCommand } from '../../types';

import getLocalizations from '../i18n/discordLocalization';

export const Pause: PlayerCommand = {
  name: localizedString('global:pause'),
  description: localizedString('global:pauseTheCurrentTrack'),
  nameLocalizations: getLocalizations('global:pause'),
  descriptionLocalizations: getLocalizations('global:pauseTheCurrentTrack'),
  voiceChannel: true,

  type: ApplicationCommandType.ChatInput,

  run: async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      const genericError = localizedString('global:genericError', {
        lng: interaction.locale,
      });
      console.log('GuildId is undefined');
      return await interaction.reply({
        content: genericError,
        ephemeral: true,
      });
    }
    const queue = global.player.getQueue(interaction.guildId);

    if (!queue) {
      const noMusicLoc = localizedString('global:noMusicCurrentlyPlaying', {
        lng: interaction.locale,
      });

      return await interaction.reply({
        content: noMusicLoc,
        ephemeral: true,
      });
    }

    if (queue.connection.paused) {
      const trackIsPaused = localizedString('global:trackIsPaused', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: trackIsPaused,
        ephemeral: true,
      });
    }

    const success = queue.setPaused(true);

    const loc = localizedString('global:currentTrackPaused', {
      lng: interaction.locale,
      title: queue.current.title,
    });

    const genericError = localizedString('global:genericError', {
      lng: interaction.locale,
      title: queue.current.title,
    });
    return await interaction.reply({
      content: success ? loc : genericError,
    });
  },
};

export default Pause;
