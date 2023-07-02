import { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';
import { useDefaultPlayer } from '../helpers/discord';
import localizedString from '../helpers/localization';

const resumeTrack = async (interaction: ChatInputCommandInteraction, interactionOptions?: InteractionReplyOptions) => {
  const genericError = localizedString('global:genericError', {
    lng: interaction.locale,
  });
  if (!interaction.guildId) {
    console.log('GuildId is undefined');
    return await interaction.reply({
      ...interactionOptions,
      content: genericError,
      ephemeral: true,
    });
  }
  const player = await useDefaultPlayer();
  const queue = player.nodes.get(interaction.guildId);

  if (!queue) {
    const loc = localizedString('global:noMusicCurrentlyPlaying', {
      lng: interaction.locale,
    });
    return await interaction.reply({
      ...interactionOptions,
      content: loc,
      ephemeral: true,
    });
  }

  if (!queue.node.isPaused()) {
    const trackAlreadyRunning = localizedString('global:trackAlreadyRunning', {
      lng: interaction.locale,
    });
    return await interaction.reply({
      ...interactionOptions,
      content: trackAlreadyRunning,
      ephemeral: true,
    });
  }

  const success = queue.node.setPaused(false);

  const currentMusicResumed = localizedString('global:currentMusicResumed', {
    lng: interaction.locale,
    title: queue.currentTrack?.title,
  });

  return await interaction.reply({
    ...interactionOptions,
    content: success ? currentMusicResumed : genericError,
  });
};

export default resumeTrack;
