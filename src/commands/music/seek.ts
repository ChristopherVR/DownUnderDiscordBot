import { ApplicationCommandOptionType, ChatInputCommandInteraction } from 'discord.js';
import { localizedString } from '../../i18n';
import { PlayerCommand } from '../../types';
import { ms } from '../helpers/ms';
import { getPlayer } from '../helpers/player';
import getLocalizations from '../i18n/discordLocalization';

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
    const queue = getPlayer().getQueue(interaction.guildId);

    if (!queue?.playing) {
      const noMusicCurrentlyPlaying = localizedString('global:noMusicCurrentlyPlaying', {
        lng: interaction.locale,
      });

      return await interaction.reply({
        content: noMusicCurrentlyPlaying,
        ephemeral: true,
      });
    }

    const timeToMS = ms(interaction.options.getString('time'));

    if (timeToMS >= queue.current.durationMS) {
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

    await queue.seek(timeToMS);

    const longMs = ms(timeToMS, {
      long: true,
    });

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
