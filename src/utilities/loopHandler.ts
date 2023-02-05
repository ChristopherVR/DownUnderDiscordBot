import { QueueRepeatMode } from 'discord-player';
import { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';
import localizedString from '../i18n';

const setLoop = async (
  interaction: ChatInputCommandInteraction,
  type: 'enable_loop_queue' | 'disable_loop' | 'enable_loop_song',
  interactionOptions?: InteractionReplyOptions,
) => {
  if (!interaction.guildId) {
    console.log('GuildId is undefined');
    const genericError = localizedString('global:genericError', {
      lng: interaction.locale,
    });
    return await interaction.reply({
      ...interactionOptions,
      content: genericError,
      ephemeral: true,
    });
  }
  const queue = global.player.getQueue(interaction.guildId);

  if (!queue?.playing) {
    const noMusicCurrentlyPlaying = localizedString('global:noMusicCurrentlyPlaying', {
      lng: interaction.locale,
    });
    return await interaction.reply({
      ...interactionOptions,
      content: noMusicCurrentlyPlaying,
      ephemeral: true,
    });
  }
  const genericError = localizedString('global:genericError', {
    lng: interaction.locale,
  });
  switch (type) {
    case 'enable_loop_queue': {
      if (queue.repeatMode === QueueRepeatMode.TRACK) {
        const disableCurrentLoop = localizedString('global:disableCurrentLoop', {
          lng: interaction.locale,
        });

        return await interaction.reply({
          ...interactionOptions,
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
        ...interactionOptions,
        content: success ? loc : genericError,
      });
    }
    case 'disable_loop': {
      const success = queue.setRepeatMode(QueueRepeatMode.OFF);

      return await interaction.reply({
        ...interactionOptions,
        content: success ? `Repeat mode **disabled**` : genericError,
      });
    }
    case 'enable_loop_song': {
      if (queue.repeatMode === QueueRepeatMode.QUEUE) {
        const locc = localizedString('global:disableCurrentLoop', {
          lng: interaction.locale,
        });
        return await interaction.reply({
          ...interactionOptions,
          content: locc,
          ephemeral: true,
        });
      }

      const success = queue.setRepeatMode(QueueRepeatMode.TRACK);

      const locc = localizedString('global:songRepeatMode', {
        lng: interaction.locale,
      });

      return await interaction.reply({
        ...interactionOptions,
        content: success ? locc : genericError,
      });
    }
    default: {
      return await interaction.reply({
        ...interactionOptions,
        content: genericError,
      });
    }
  }
};

export default setLoop;
