import { QueueRepeatMode } from 'discord-player';
import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from 'discord.js';
import i18next from 'i18next';
import { PlayerCommand } from '../../types';
import { getPlayer } from '../helpers/player';
import getLocalizations from '../i18n/discordLocalization';

export const Loop: PlayerCommand = {
  name: i18next.t('global:loop'),
  description: i18next.t('global:enableDisableLoopDescription'),
  nameLocalizations: getLocalizations('global:loop'),
  descriptionLocalizations: getLocalizations('global:enableDisableLoopDescription'),
  voiceChannel: true,
  options: [
    {
      name: i18next.t('global:action'),
      description: i18next.t('global:whatActionToPerform'),
      nameLocalizations: getLocalizations('global:action'),
      descriptionLocalizations: getLocalizations('global:whatActionToPerform'),
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: i18next.t('global:queue'), value: 'enable_loop_queue' },
        { name: i18next.t('global:disable'), value: 'disable_loop' },
        { name: i18next.t('global:song'), value: 'enable_loop_song' },
      ],
    },
  ],
  type: ApplicationCommandType.ChatInput,

  run: async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      console.log('GuildId is undefined');
      const genericError = i18next.t('global:genericError', {
        lng: interaction.locale,
      });
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
    const genericError = i18next.t('global:genericError', {
      lng: interaction.locale,
    });
    switch (interaction.options.data.map((x) => x.value).toString()) {
      case 'enable_loop_queue': {
        if (queue.repeatMode === 1) {
          const disableCurrentLoop = i18next.t('global:disableCurrentLoop', {
            lng: interaction.locale,
          });

          return await interaction.reply({
            content: disableCurrentLoop,
            ephemeral: true,
          });
        }

        const success = queue.setRepeatMode(QueueRepeatMode.QUEUE);

        const loc = i18next.t('global:songRepeatMode', {
          lng: interaction.locale,
        });

        // songRepeatMode
        return await interaction.reply({
          content: success ? loc : genericError,
        });
      }
      case 'disable_loop': {
        const success = queue.setRepeatMode(QueueRepeatMode.OFF);

        return await interaction.reply({
          content: success ? `Repeat mode **disabled**` : genericError,
        });
      }
      case 'enable_loop_song': {
        if (queue.repeatMode === 2) {
          const locc = i18next.t('global:disableCurrentLoop', {
            lng: interaction.locale,
          });
          return await interaction.reply({
            content: locc,
            ephemeral: true,
          });
        }

        const success = queue.setRepeatMode(QueueRepeatMode.TRACK);

        const locc = i18next.t('global:songRepeatMode', {
          lng: interaction.locale,
        });

        return await interaction.reply({
          content: success ? locc : genericError,
        });
      }
      default: {
        return await interaction.reply({
          content: genericError,
        });
      }
    }
  },
};

export default Loop;
