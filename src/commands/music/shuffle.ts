import { ChatInputCommandInteraction } from 'discord.js';
import i18next from 'i18next';
import { PlayerCommand } from '../../types';
import { getPlayer } from '../helpers/player';
import getLocalizations from '../i18n/discordLocalization';

export const Shuffle: PlayerCommand = {
  name: i18next.t('global:shuffle'),
  description: i18next.t('global:shuffleTheTrack'),
  nameLocalizations: getLocalizations('global:shuffle'),
  descriptionLocalizations: getLocalizations('global:shuffleTheTrack'),
  voiceChannel: true,

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

    if (!queue?.playing) {
      const noMusicCurrentlyPlaying = i18next.t('global:noMusicCurrentlyPlaying', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: noMusicCurrentlyPlaying,
        ephemeral: true,
      });
    }

    if (!queue.tracks[0]) {
      const noTrackInQueue = i18next.t('global:noTrackInQueue', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: noTrackInQueue,
        ephemeral: true,
      });
    }

    queue.shuffle();
    const queueShuffled = i18next.t('global:queueShuffled', {
      lng: interaction.locale,
      count: queue.tracks.length,
    });
    return await interaction.reply({
      content: queueShuffled,
    });
  },
};

export default Shuffle;
