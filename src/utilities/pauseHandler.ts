import { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';
import localizedString from '../i18n';

const pauseTrack = async (interaction: ChatInputCommandInteraction, interactionOptions?: InteractionReplyOptions) => {
  if (!interaction.guildId) {
    const genericError = localizedString('global:genericError', {
      lng: interaction.locale,
    });
    console.log('GuildId is undefined');
    return await interaction.reply({
      ...interactionOptions,
      content: genericError,
      ephemeral: true,
    });
  }
  const queue = global.player.getQueue(interaction.guildId);

  if (!queue) {
    const noMusicLoc = localizedString('global:noMusicCurrentlyPlaying', {
      lng: interaction.locale,
    });

    return await interaction.reply({
      ...interactionOptions,
      content: noMusicLoc,
      ephemeral: true,
    });
  }

  if (queue.connection.paused) {
    const trackIsPaused = localizedString('global:trackIsPaused', {
      lng: interaction.locale,
    });
    return await interaction.reply({
      ...interactionOptions,
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
  return await interaction.reply({
    ...interactionOptions,
    content: success ? loc : genericError,
  });
};

export default pauseTrack;
