import { ChatInputCommandInteraction } from 'discord.js';
import { localizedString } from '../../i18n';
import { PlayerCommand } from '../../types';

import getLocalizations from '../../i18n/discordLocalization';

export const Shuffle: PlayerCommand = {
  name: localizedString('global:shuffle'),
  description: localizedString('global:shuffleTheTrack'),
  nameLocalizations: getLocalizations('global:shuffle'),
  descriptionLocalizations: getLocalizations('global:shuffleTheTrack'),
  voiceChannel: true,

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

    if (!queue?.playing) {
      const noMusicCurrentlyPlaying = localizedString('global:noMusicCurrentlyPlaying', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: noMusicCurrentlyPlaying,
        ephemeral: true,
      });
    }

    if (!queue.tracks[0]) {
      const noTrackInQueue = localizedString('global:noTrackInQueue', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: noTrackInQueue,
        ephemeral: true,
      });
    }

    queue.shuffle();
    const queueShuffled = localizedString('global:queueShuffled', {
      lng: interaction.locale,
      count: queue.tracks.length,
    });
    return await interaction.reply({
      content: queueShuffled,
    });
  },
};

export default Shuffle;
