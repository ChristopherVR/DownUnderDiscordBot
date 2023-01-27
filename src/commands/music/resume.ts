import { ChatInputCommandInteraction } from 'discord.js';
import { localizedString } from '../../i18n';
import { PlayerCommand } from '../../types';

import getLocalizations from '../i18n/discordLocalization';

export const Resume: PlayerCommand = {
  name: localizedString('global:resume'),
  description: localizedString('global:playTheTrack'),
  nameLocalizations: getLocalizations('global:resume'),
  descriptionLocalizations: getLocalizations('global:playTheTrack'),
  voiceChannel: true,
  run: async (interaction: ChatInputCommandInteraction) => {
    const genericError = localizedString('global:genericError', {
      lng: interaction.locale,
    });
    if (!interaction.guildId) {
      console.log('GuildId is undefined');
      return await interaction.reply({
        content: genericError,
        ephemeral: true,
      });
    }
    const queue = global.player.getQueue(interaction.guildId);

    if (!queue) {
      const loc = localizedString('global:noMusicCurrentlyPlaying', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: loc,
        ephemeral: true,
      });
    }

    if (!queue.connection.paused) {
      const trackAlreadyRunning = localizedString('global:trackAlreadyRunning', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: trackAlreadyRunning,
        ephemeral: true,
      });
    }

    const success = queue.setPaused(false);

    const currentMusicResumed = localizedString('global:currentMusicResumed', {
      lng: interaction.locale,
      title: queue.current.title,
    });

    return await interaction.reply({
      content: success ? currentMusicResumed : genericError,
    });
  },
};

export default Resume;
