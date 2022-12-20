import { ChatInputCommandInteraction } from 'discord.js';
import i18next from 'i18next';
import { PlayerCommand } from '../../types';
import { getPlayer } from '../helpers/player';
import getLocalizations from '../i18n/discordLocalization';

export const Resume: PlayerCommand = {
  name: i18next.t('global:resume'),
  description: i18next.t('global:playTheTrack'),
  nameLocalizations: getLocalizations('global:resume'),
  descriptionLocalizations: getLocalizations('global:playTheTrack'),
  voiceChannel: true,
  run: async (interaction: ChatInputCommandInteraction) => {
    const genericError = i18next.t('global:genericError', {
      lng: interaction.locale,
    });
    if (!interaction.guildId) {
      console.log('GuildId is undefined');
      return await interaction.reply({
        content: genericError,
        ephemeral: true,
      });
    }
    const queue = getPlayer().getQueue(interaction.guildId);

    if (!queue) {
      const loc = i18next.t('global:noMusicCurrentlyPlaying', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: loc,
        ephemeral: true,
      });
    }

    if (!queue.connection.paused) {
      const trackAlreadyRunning = i18next.t('global:trackAlreadyRunning', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: trackAlreadyRunning,
        ephemeral: true,
      });
    }

    const success = queue.setPaused(false);

    const currentMusicResumed = i18next.t('global:currentMusicResumed', {
      lng: interaction.locale,
      title: queue.current.title,
    });

    return await interaction.reply({
      content: success ? currentMusicResumed : genericError,
    });
  },
};

export default Resume;
