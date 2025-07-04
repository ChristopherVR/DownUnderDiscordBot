import { ApplicationCommandType, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { PlayerCommand } from '../../models/discord.js';

import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { useDefaultPlayer } from '../../helpers/discord/player.js';
import { logger } from '../../helpers/logger/logger.js';
import { DefaultLoggerMessage } from '../../enums/logger.js';

export const Clear: PlayerCommand = {
  name: localizedString('global:clear'),
  description: localizedString('global:clearAllInQueue'),
  nameLocalizations: getLocalizations('global:clear'),
  descriptionLocalizations: getLocalizations('global:clearAllInQueue'),

  type: ApplicationCommandType.ChatInput,
  run: async (interaction: ChatInputCommandInteraction) => {
    const { localize } = useLocalizedString(interaction.locale);
    try {
      if (!interaction.guildId) {
        logger(DefaultLoggerMessage.GuildIsNotDefined).error();
        return await interaction.reply({
          content: localize('global:genericError'),
          ephemeral: true,
        });
      }

      const player = useDefaultPlayer();
      const queue = player.nodes.get(interaction.guildId);

      if (!queue?.isPlaying()) {
        return await interaction.reply({
          content: localize('global:noMusicCurrentlyPlaying'),
          ephemeral: true,
        });
      }

      const memberChannel = (interaction.member as GuildMember | null)?.voice.channel;
      if (!memberChannel || memberChannel.id !== queue.channel?.id) {
        return await interaction.reply({
          content: localize('global:mustBeInSameVoiceChannel'),
          ephemeral: true,
        });
      }

      if (queue.tracks.data.length === 0) {
        return await interaction.reply({
          content: localize('global:noTrackInQueue'),
          ephemeral: true,
        });
      }

      queue.tracks.clear();

      await interaction.reply(localize('global:queueHasBeenCleared'));
    } catch (error) {
      if (error instanceof Error) {
        logger(error).error();
      } else {
        logger(String(error)).error();
      }
      await interaction.reply({
        content: localize('global:genericError'),
        ephemeral: true,
      });
    }
  },
};

export default Clear;
