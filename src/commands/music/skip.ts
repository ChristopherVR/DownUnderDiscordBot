import { ChatInputCommandInteraction } from 'discord.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { PlayerCommand } from '../../models/discord.js';

import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { useDefaultPlayer } from '../../helpers/discord/player.js';
import { logger, DefaultLoggerMessage } from '../../helpers/logger/logger.js';

export const Skip: PlayerCommand = {
  name: localizedString('global:skip'),
  description: localizedString('global:skipTrackDesc'),
  nameLocalizations: getLocalizations('global:skip'),
  descriptionLocalizations: getLocalizations('global:skipTrackDesc'),

  run: async (interaction: ChatInputCommandInteraction) => {
    const { localize } = useLocalizedString(interaction.locale);
    const genericError = localize('global:genericError');
    if (!interaction.guildId) {
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

    const success = queue.node.skip();
    const currentTrackSkipped = localize('global:currentTrackSkipped', {
      lng: interaction.locale,
      title: queue.currentTrack?.title,
    });
    return await interaction.reply({
      content: success ? currentTrackSkipped : genericError,
    });
  },
};

export default Skip;
