import { ApplicationCommandOptionType, ChatInputCommandInteraction } from 'discord.js';
import i18next from 'i18next';
import { PlayerCommand } from '../../types';
import { ms } from '../helpers/ms';
import { getPlayer } from '../helpers/player';
import getLocalizations from '../i18n/discordLocalization';

export const Seek: PlayerCommand = {
  name: i18next.t('global:seek'),
  description: i18next.t('global:skipBackAndForth'),
  nameLocalizations: getLocalizations('global:seek'),
  descriptionLocalizations: getLocalizations('global:skipBackAndForth'),
  voiceChannel: true,
  options: [
    {
      name: i18next.t('global:time'),
      description: i18next.t('global:timeToSkip'),
      nameLocalizations: getLocalizations('global:time'),
      descriptionLocalizations: getLocalizations('global:timeToSkip'),
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  run: async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      const genericError = i18next.t('global:genericError', {
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
      const noMusicCurrentlyPlaying = i18next.t('global:noMusicCurrentlyPlaying', {
        lng: interaction.locale,
      });

      return await interaction.reply({
        content: noMusicCurrentlyPlaying,
        ephemeral: true,
      });
    }

    const timeToMS = ms(interaction.options.getString('time'));

    if (timeToMS >= queue.current.durationMS) {
      const indicatedTimeIsTooHigh = i18next.t('global:indicatedTimeIsTooHigh', {
        lng: interaction.locale,
      });
      const validSkipHint = i18next.t('global:validSkipHint', {
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

    const timeSetInCurrentTrack = i18next.t('global:timeSetInCurrentTrack', {
      lng: interaction.locale,
      time: longMs,
    });

    return await interaction.reply({
      content: timeSetInCurrentTrack,
    });
  },
};

export default Seek;
