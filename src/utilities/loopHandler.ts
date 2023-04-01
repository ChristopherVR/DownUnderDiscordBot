import { QueueRepeatMode } from 'discord-player';
import { ChatInputCommandInteraction, InteractionResponse, Message } from 'discord.js';
import { useDefaultPlayer } from '../helpers/discord';
import localizedString from '../helpers/localization';

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
  const player = useDefaultPlayer();
  const queue = player.nodes.get(interaction.guildId);

  if (!queue?.isPlaying()) {
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

      queue.setRepeatMode(QueueRepeatMode.QUEUE);

      const loc = localizedString('global:songRepeatMode', {
        lng: interaction.locale,
      });

      // songRepeatMode
      return await response({
        content: loc,
      });
    }
    case 'disable_loop': {
      queue.setRepeatMode(QueueRepeatMode.OFF);

      return await response({
        content: localizedString('global:repeatModeDisabled', { lng: interaction.locale }),
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

      queue.setRepeatMode(QueueRepeatMode.TRACK);

      const locc = localizedString('global:songRepeatMode', {
        lng: interaction.locale,
      });

      return await response({
        content: locc,
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
