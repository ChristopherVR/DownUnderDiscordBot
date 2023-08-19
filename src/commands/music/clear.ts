import { ApplicationCommandType, ChatInputCommandInteraction } from 'discord.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { PlayerCommand } from '../../models/discord.js';

import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { useDefaultPlayer } from '../../helpers/discord/player.js';
import { logger } from '../../helpers/logger/logger.js';
import { DefaultLoggerMessage } from '../../constants/logger.js';
export const Clear: PlayerCommand = {
  name: localizedString('global:clear'),
  description: localizedString('global:clearAllInQueue'),
  nameLocalizations: getLocalizations('global:clear'),
  descriptionLocalizations: getLocalizations('global:clearAllInQueue'),

  type: ApplicationCommandType.ChatInput,
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
      const response = localize('global:noMusicCurrentlyPlaying');
      return await interaction.reply({
        content: response,
        ephemeral: true,
      });
    }

    if (!queue.tracks[0]) {
      const response = localize('global:noTrackInQueue');
      return await interaction.reply({
        content: response,
        ephemeral: true,
      });
    }

    queue.tracks.clear();

    const response = localize('global:queueHasBeenCleared');
    return await interaction.reply(response);
  },
};

export default Clear;
