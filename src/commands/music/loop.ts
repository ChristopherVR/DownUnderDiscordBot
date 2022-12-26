import { QueueRepeatMode } from 'discord-player';
import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from 'discord.js';
import { localizedString } from '../../i18n';
import { PlayerCommand } from '../../types';
import { getPlayer } from '../helpers/player';
import getLocalizations from '../i18n/discordLocalization';

export const Loop: PlayerCommand = {
  name: localizedString('global:loop'),
  description: localizedString('global:enableDisableLoopDescription'),
  nameLocalizations: getLocalizations('global:loop'),
  descriptionLocalizations: getLocalizations('global:enableDisableLoopDescription'),
  voiceChannel: true,
  options: [
    {
      name: localizedString('global:action'),
      description: localizedString('global:whatActionToPerform'),
      nameLocalizations: getLocalizations('global:action'),
      descriptionLocalizations: getLocalizations('global:whatActionToPerform'),
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: localizedString('global:queue'), value: 'enable_loop_queue' },
        { name: localizedString('global:disable'), value: 'disable_loop' },
        { name: localizedString('global:song'), value: 'enable_loop_song' },
      ],
    },
  ],
  type: ApplicationCommandType.ChatInput,

  run: async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      console.log('GuildId is undefined');
      const genericError = localizedString('global:genericError', {
        lng: interaction.locale,
      });
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
    const genericError = localizedString('global:genericError', {
      lng: interaction.locale,
    });
    switch (interaction.options.data.map((x) => x.value).toString()) {
      case 'enable_loop_queue': {
        if (queue.repeatMode === 1) {
          const disableCurrentLoop = localizedString('global:disableCurrentLoop', {
            lng: interaction.locale,
          });

          return await interaction.reply({
            content: disableCurrentLoop,
            ephemeral: true,
          });
        }

        const success = queue.setRepeatMode(QueueRepeatMode.QUEUE);

        const loc = localizedString('global:songRepeatMode', {
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
          const locc = localizedString('global:disableCurrentLoop', {
            lng: interaction.locale,
          });
          return await interaction.reply({
            content: locc,
            ephemeral: true,
          });
        }

        const success = queue.setRepeatMode(QueueRepeatMode.TRACK);

        const locc = localizedString('global:songRepeatMode', {
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
