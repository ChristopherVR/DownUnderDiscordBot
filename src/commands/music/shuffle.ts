import { ChatInputCommandInteraction } from 'discord.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { PlayerCommand } from '../../models/discord.js';

import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { useDefaultPlayer } from '../../helpers/discord/player.js';
import { logger, DefaultLoggerMessage } from '../../helpers/logger/logger.js';

export const Shuffle: PlayerCommand = {
  name: localizedString('global:shuffle'),
  description: localizedString('global:shuffleTheTrack'),
  nameLocalizations: getLocalizations('global:shuffle'),
  descriptionLocalizations: getLocalizations('global:shuffleTheTrack'),

  run: async (interaction: ChatInputCommandInteraction) => {
    const { localize } = useLocalizedString(interaction.locale);
    if (!interaction.guildId) {
      const genericError = localize('global:genericError');
      logger(DefaultLoggerMessage.GuildIsNotDefined).error();
      return await interaction.reply({
        content: genericError,
        ephemeral: true,
      });
    }
    const player = await useDefaultPlayer();
    const queue = player.nodes.get(interaction.guildId);

    if (!queue?.isPlaying()) {
      const noMusicCurrentlyPlaying = localize('global:noMusicCurrentlyPlaying');
      return await interaction.reply({
        content: noMusicCurrentlyPlaying,
        ephemeral: true,
      });
    }

    if (!queue.tracks[0]) {
      const noTrackInQueue = localize('global:noTrackInQueue');
      return await interaction.reply({
        content: noTrackInQueue,
        ephemeral: true,
      });
    }

    queue.tracks.shuffle();
    const queueShuffled = localize('global:queueShuffled', {
      lng: interaction.locale,
      count: queue.tracks.data.length,
    });
    return await interaction.reply({
      content: queueShuffled,
    });
  },
};

export default Shuffle;
