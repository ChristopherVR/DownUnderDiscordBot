import { ChatInputCommandInteraction, InteractionResponse, Message } from 'discord.js';
import { useDefaultPlayer } from '../helpers/discord';
import localizedString from '../helpers/localization';

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
  const player = await useDefaultPlayer();
  const queue = player.nodes.get(interaction.guildId);

  if (!queue) {
    const noMusicLoc = localizedString('global:noMusicCurrentlyPlaying', {
      lng: interaction.locale,
    });

    return await response({
      content: noMusicLoc,
      ephemeral: true,
    });
  }

  if (queue.node.isPaused()) {
    const trackIsPaused = localizedString('global:trackIsPaused', {
      lng: interaction.locale,
    });
    return await response({
      content: trackIsPaused,
      ephemeral: true,
    });
  }

  const success = queue.node.pause();

  const loc = localizedString('global:currentTrackPaused', {
    lng: interaction.locale,
    title: queue.currentTrack?.title,
  });

  const genericError = localizedString('global:genericError', {
    lng: interaction.locale,
    title: queue.currentTrack?.title,
  });
  return await response({
    content: success ? loc : genericError,
  });
};

export default pauseTrack;
