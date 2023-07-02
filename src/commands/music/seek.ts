import { ApplicationCommandOptionType, ChatInputCommandInteraction } from 'discord.js';
import { localizedString } from '../../helpers/localization';
import { PlayerCommand } from '../../types';
import { ms } from '../../helpers/ms';

import getLocalizations from '../../helpers/multiMapLocalization';
import { useDefaultPlayer } from '../../helpers/discord';

export const Seek: PlayerCommand = {
  name: localizedString('global:seek'),
  description: localizedString('global:skipBackAndForth'),
  nameLocalizations: getLocalizations('global:seek'),
  descriptionLocalizations: getLocalizations('global:skipBackAndForth'),
  voiceChannel: true,
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
    const player = await useDefaultPlayer();
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

    const timeToMS = ms(interaction.options.getString('time'));

    if (timeToMS >= (queue.currentTrack?.durationMS ?? 0)) {
      const indicatedTimeIsTooHigh = localizedString('global:indicatedTimeIsTooHigh', {
        lng: interaction.locale,
      });
      const validSkipHint = localizedString('global:validSkipHint', {
        lng: interaction.locale,
      });

      return await interaction.reply({
        content: `${indicatedTimeIsTooHigh}\n${validSkipHint}`,
        ephemeral: true,
      });
    }

    await queue.node.seek(timeToMS);

    const longMs = ms(timeToMS);

    const timeSetInCurrentTrack = localizedString('global:timeSetInCurrentTrack', {
      lng: interaction.locale,
      time: longMs,
    });

    return await interaction.reply({
      content: timeSetInCurrentTrack,
    });
  },
};

export default Seek;
