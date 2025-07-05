import { ApplicationCommandOptionType, ChatInputCommandInteraction, GuildMember, MessageFlags } from 'discord.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { PlayerCommand } from '../../models/discord.js';
import { ms } from '../../helpers/time/ms.js';

import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { useDefaultPlayer } from '../../helpers/discord/player.js';
import { logger } from '../../helpers/logger/logger.js';

export const Seek: PlayerCommand = {
  name: localizedString('global:seek'),
  description: localizedString('global:skipBackAndForth'),
  nameLocalizations: getLocalizations('global:seek'),
  descriptionLocalizations: getLocalizations('global:skipBackAndForth'),
  options: [
    {
      name: localizedString('global:time'),
      description: localizedString('global:timeToSkip'),
      nameLocalizations: getLocalizations('global:time'),
      descriptionLocalizations: getLocalizations('global:timeToSkip'),
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  run: async (interaction: ChatInputCommandInteraction) => {
    const { localize } = useLocalizedString(interaction.locale);
    try {
      if (!interaction.guildId || !interaction.guild) {
        logger.error('Guild is not defined.');
        return await interaction.reply({
          content: localize('global:genericError'),
          flags: MessageFlags.Ephemeral,
        });
      }
      const player = useDefaultPlayer();
      const queue = player.nodes.get(interaction.guildId);

      if (!queue?.isPlaying() || !queue.currentTrack) {
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

      const timeToMS = ms(interaction.options.getString('time', true));

      if (timeToMS >= queue.currentTrack.durationMS) {
        return await interaction.reply({
          content: `${localize('global:indicatedTimeIsTooHigh')}\n${localize('global:validSkipHint')}`,
          flags: MessageFlags.Ephemeral,
        });
      }

      await queue.node.seek(timeToMS);

      return await interaction.reply({
        content: localize('global:timeSetInCurrentTrack', {
          time: ms(timeToMS),
        }),
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid time value')) {
        return await interaction.reply({
          content: localize('global:invalidMsFormat'),
          flags: MessageFlags.Ephemeral,
        });
      }

      logger.error(error);

      if (interaction.replied || interaction.deferred) {
        return await interaction.followUp({
          content: localize('global:genericError'),
          flags: MessageFlags.Ephemeral,
        });
      }
      return await interaction.reply({
        content: localize('global:genericError'),
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

export default Seek;
