import { ApplicationCommandOptionType, ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { PlayerCommand } from '../../models/discord.js';

import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { useDefaultPlayer } from '../../helpers/discord/player.js';
import { logger } from '../../helpers/logger/logger.js';
import { DefaultLoggerMessage } from '../../enums/logger.js';
import { VolumeInputInteraction } from '../../models/commands/volume.js';

const replyToUser = async (interaction: ChatInputCommandInteraction, interactionOptions: InteractionReplyOptions) => {
  if (interaction.deferred || interaction.replied) {
    await interaction.deleteReply();
    return await interaction.followUp({
      ...interactionOptions,
    });
  }

  return await interaction.reply({
    ...interactionOptions,
  });
};

export const Volume: PlayerCommand = {
  name: localizedString('global:volume'),
  nameLocalizations: getLocalizations('global:volume'),
  description: localizedString('global:adjustVolume'),
  descriptionLocalizations: getLocalizations('global:adjustVolume'),

  options: [
    {
      name: localizedString('volume'),
      nameLocalizations: getLocalizations('global:volume'),
      description: localizedString('global:amountOfVolume'),
      descriptionLocalizations: getLocalizations('global:amountOfVolume'),
      type: ApplicationCommandOptionType.Number,
      required: true,
      minValue: 1,
      maxValue: 100,
    },
  ],
  run: async (interaction: VolumeInputInteraction) => {
    const { localize } = useLocalizedString(interaction.locale);
    const genericError = localize('global:genericError');
    if (!interaction.guildId) {
      logger(DefaultLoggerMessage.GuildIsNotDefined).error();
      return await replyToUser(interaction, {
        content: genericError,
        ephemeral: true,
      });
    }
    const player = await useDefaultPlayer();
    const queue = player.nodes.get(interaction.guildId);

    if (!queue) {
      const noMusicCurrentlyPlaying = localize('global:noMusicCurrentlyPlaying');
      return await replyToUser(interaction, {
        ephemeral: true,
        content: noMusicCurrentlyPlaying,
      });
    }

    let vol = interaction.options.getNumber('volume') ?? queue.node.volume ?? 100;

    if (interaction.volume) {
      vol = interaction.increase ? vol + interaction.volume : vol - interaction.volume;
    }

    if (queue.node.volume === vol) {
      const volumeAlreadyTheSame = localize('global:volumeAlreadyTheSame');

      return await replyToUser(interaction, {
        content: volumeAlreadyTheSame,
        ephemeral: true,
      });
    }
    const success = queue.node.setVolume(vol);
    const volumeHasBeenModifiedTo = localize('global:volumeHasBeenModifiedTo', {
      lng: interaction.locale,
      volume: vol,
    });

    return await replyToUser(interaction, {
      content: success ? volumeHasBeenModifiedTo : genericError,
    });
  },
};

export default Volume;
