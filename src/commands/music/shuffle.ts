import { ChatInputCommandInteraction } from 'discord.js';
import { localizedString } from '../../i18n';
import { PlayerCommand } from '../../types';

import getLocalizations from '../../i18n/discordLocalization';
import { useDefaultPlayer } from '../../helpers/discord';

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
    const player = useDefaultPlayer();
    const queue = player.nodes.get(interaction.guildId);

    if (!queue?.isPlaying()) {
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

    queue.tracks.shuffle();
    const queueShuffled = localizedString('global:queueShuffled', {
      lng: interaction.locale,
      count: queue.tracks.data.length,
    });
    return await interaction.reply({
      content: queueShuffled,
    });
  },
};

export default Shuffle;
