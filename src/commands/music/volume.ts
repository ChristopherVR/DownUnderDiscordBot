import { ApplicationCommandOptionType, ChatInputCommandInteraction, GuildMember, MessageFlags } from 'discord.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { PlayerCommand } from '../../models/discord.js';

import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { useDefaultPlayer } from '../../helpers/discord/player.js';
import { logger } from '../../helpers/logger/logger.js';

export const Volume: PlayerCommand = {
  name: localizedString('global:volume'),
  nameLocalizations: getLocalizations('global:volume'),
  description: localizedString('global:adjustVolume'),
  descriptionLocalizations: getLocalizations('global:adjustVolume'),

  options: [
    {
      name: localizedString('global:volume'),
      nameLocalizations: getLocalizations('global:volume'),
      description: localizedString('global:amountOfVolume'),
      descriptionLocalizations: getLocalizations('global:amountOfVolume'),
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
  ],
  run: async (interaction: ChatInputCommandInteraction) => {
    const { localize } = useLocalizedString(interaction.locale);
    try {
      if (!interaction.guildId || !interaction.guild) {
        logger.error('Guild is not defined.');
        return await interaction.reply({ content: localize('global:genericError'), flags: MessageFlags.Ephemeral });
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

      const vol = interaction.options.getNumber('volume', true);

      if (vol < 0 || vol > 200) {
        return await interaction.reply({
          content: localize('global:volumeMustBeBetween', { min: 0, max: 200 }),
          flags: MessageFlags.Ephemeral,
        });
      }

      if (queue.node.volume === vol) {
        return await interaction.reply({
          content: localize('global:volumeAlreadyTheSame'),
          flags: MessageFlags.Ephemeral,
        });
      }

      const success = queue.node.setVolume(vol);

      return await interaction.reply({
        content: success
          ? localize('global:volumeHasBeenModifiedTo', { volume: vol })
          : localize('global:genericError'),
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      logger.error(error);
      if (interaction.replied || interaction.deferred) {
        return await interaction.followUp({ content: localize('global:genericError'), flags: MessageFlags.Ephemeral });
      }
      return await interaction.reply({ content: localize('global:genericError'), flags: MessageFlags.Ephemeral });
    }
  },
};

export default Volume;
