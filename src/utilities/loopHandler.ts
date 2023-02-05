import { QueueRepeatMode } from 'discord-player';
import { ChatInputCommandInteraction, InteractionResponse, Message } from 'discord.js';
import localizedString from '../i18n';

const setLoop = async (
  interaction: ChatInputCommandInteraction,
  type: 'enable_loop_queue' | 'disable_loop' | 'enable_loop_song',
  response: (
    options: object,
  ) => Promise<InteractionResponse<boolean> | Message<boolean> | undefined> | Promise<void> | Awaited<void> | void,
) => {
  if (!interaction.guildId) {
    console.log('GuildId is undefined');
    const genericError = localizedString('global:genericError', {
      lng: interaction.locale,
    });
    return await response({
      content: genericError,
      ephemeral: true,
    });
  }
  const queue = global.player.getQueue(interaction.guildId);

  if (!queue?.playing) {
    const noMusicCurrentlyPlaying = localizedString('global:noMusicCurrentlyPlaying', {
      lng: interaction.locale,
    });
    return await response({
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

        return await response({
          content: disableCurrentLoop,
          ephemeral: true,
        });
      }

      const success = queue.setRepeatMode(QueueRepeatMode.QUEUE);

      const loc = localizedString('global:songRepeatMode', {
        lng: interaction.locale,
      });

      // songRepeatMode
      return await response({
        content: success ? loc : genericError,
      });
    }
    case 'disable_loop': {
      const success = queue.setRepeatMode(QueueRepeatMode.OFF);

      return await response({
        content: success ? `Repeat mode **disabled**` : genericError,
      });
    }
    case 'enable_loop_song': {
      if (queue.repeatMode === QueueRepeatMode.QUEUE) {
        const locc = localizedString('global:disableCurrentLoop', {
          lng: interaction.locale,
        });
        return await response({
          content: locc,
          ephemeral: true,
        });
      }

      const success = queue.setRepeatMode(QueueRepeatMode.TRACK);

      const locc = localizedString('global:songRepeatMode', {
        lng: interaction.locale,
      });

      return await response({
        content: success ? locc : genericError,
      });
    }
    default: {
      return await response({
        content: genericError,
      });
    }
  }
};

export default setLoop;
