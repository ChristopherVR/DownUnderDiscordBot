import { ApplicationCommandType, ChatInputCommandInteraction, GuildMember, MessageFlags } from 'discord.js';
import { PlayerCommand } from '../../models/discord.js';

import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { useDefaultPlayer } from '../../helpers/discord/player.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { logger } from '../../helpers/logger/logger.js';

export const Back: PlayerCommand = {
  name: localizedString('global:back'),
  description: localizedString('global:backToPreviousSong'),
  nameLocalizations: getLocalizations('global:back'),
  descriptionLocalizations: getLocalizations('global:backToPreviousSong'),

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

      if (!queue.history.previousTrack) {
        return await interaction.reply({
          content: localize('global:noMusicPlayedPreviously'),
          flags: MessageFlags.Ephemeral,
        });
      }

      await queue.history.back();
      await interaction.reply({ content: localize('global:playingPreviousTrack'), flags: MessageFlags.Ephemeral });
    } catch (error) {
      logger.error(error);
      await interaction.reply({
        content: localize('global:genericError'),
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

export default Back;
