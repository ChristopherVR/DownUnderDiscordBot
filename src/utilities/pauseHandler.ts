import { ChatInputCommandInteraction, InteractionResponse, Message } from 'discord.js';
import localizedString from '../i18n';

const pauseTrack = async (
  interaction: ChatInputCommandInteraction,
  response: (
    options: object,
  ) => Promise<InteractionResponse<boolean> | Message<boolean> | undefined> | Promise<void> | Awaited<void> | void,
) => {
  if (!interaction.guildId) {
    const genericError = localizedString('global:genericError', {
      lng: interaction.locale,
    });
    console.log('GuildId is undefined');
    return await response({
      content: genericError,
      ephemeral: true,
    });
  }
  const queue = global.player.getQueue(interaction.guildId);

  if (!queue) {
    const noMusicLoc = localizedString('global:noMusicCurrentlyPlaying', {
      lng: interaction.locale,
    });

    return await response({
      content: noMusicLoc,
      ephemeral: true,
    });
  }

  if (queue.connection.paused) {
    const trackIsPaused = localizedString('global:trackIsPaused', {
      lng: interaction.locale,
    });
    return await response({
      content: trackIsPaused,
      ephemeral: true,
    });
  }

  const success = queue.setPaused(true);

  const loc = localizedString('global:currentTrackPaused', {
    lng: interaction.locale,
    title: queue.current.title,
  });

  const genericError = localizedString('global:genericError', {
    lng: interaction.locale,
    title: queue.current.title,
  });
  return await response({
    content: success ? loc : genericError,
  });
};

export default pauseTrack;
