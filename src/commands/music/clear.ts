import { ApplicationCommandType, ChatInputCommandInteraction, GuildMember, MessageFlags } from 'discord.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { PlayerCommand } from '../../models/discord.js';

import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { useDefaultPlayer } from '../../helpers/discord/player.js';
import { logger } from '../../helpers/logger/logger.js';

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
        logger.error('Guild is not defined.');
        return await interaction.reply({
          content: localize('global:genericError'),
          flags: MessageFlags.Ephemeral,
        });
      }

      const player = useDefaultPlayer();
      const queue = player.nodes.get(interaction.guildId);

      if (!queue?.isPlaying()) {
        return await interaction.reply({
          content: localize('global:noMusicCurrentlyPlaying'),
          flags: MessageFlags.Ephemeral,
        });
      }

      const memberChannel = (interaction.member as GuildMember | null)?.voice.channel;
      if (!memberChannel || memberChannel.id !== queue.channel?.id) {
        return await interaction.reply({
          content: localize('global:mustBeInSameVoiceChannel'),
          flags: MessageFlags.Ephemeral,
        });
      }

      if (queue.tracks.data.length === 0) {
        return await interaction.reply({
          content: localize('global:noTrackInQueue'),
          flags: MessageFlags.Ephemeral,
        });
      }

      queue.tracks.clear();

      await interaction.reply({ content: localize('global:queueHasBeenCleared'), flags: MessageFlags.Ephemeral });
    } catch (error) {
      logger.error(error);
      await interaction.reply({
        content: localize('global:genericError'),
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

export default Clear;
