import { ApplicationCommandType, ChatInputCommandInteraction } from 'discord.js';
import i18next from 'i18next';
import { PlayerCommand } from '../../types';
import { getPlayer } from '../helpers/player';
import getLocalizations from '../i18n/discordLocalization';

export const Pause: PlayerCommand = {
  name: i18next.t('global:pause'),
  description: i18next.t('global:pauseTheCurrentTrack'),
  nameLocalizations: getLocalizations('global:pause'),
  descriptionLocalizations: getLocalizations('global:pauseTheCurrentTrack'),
  voiceChannel: true,

  type: ApplicationCommandType.ChatInput,

  run: async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      const genericError = i18next.t('global:genericError', {
        lng: interaction.locale,
      });
      console.log('GuildId is undefined');
      return await interaction.reply({
        content: genericError,
        ephemeral: true,
      });
    }
    const queue = getPlayer().getQueue(interaction.guildId);

    if (!queue) {
      const noMusicLoc = i18next.t('global:noMusicCurrentlyPlaying', {
        lng: interaction.locale,
      });

      return await interaction.reply({
        content: noMusicLoc,
        ephemeral: true,
      });
    }

    if (queue.connection.paused) {
      const trackIsPaused = i18next.t('global:trackIsPaused', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: trackIsPaused,
        ephemeral: true,
      });
    }

    const success = queue.setPaused(true);

    const loc = i18next.t('global:currentTrackPaused', {
      lng: interaction.locale,
      title: queue.current.title,
    });

    const genericError = i18next.t('global:genericError', {
      lng: interaction.locale,
      title: queue.current.title,
    });
    return await interaction.reply({
      content: success ? loc : genericError,
    });
  },
};

export default Pause;
