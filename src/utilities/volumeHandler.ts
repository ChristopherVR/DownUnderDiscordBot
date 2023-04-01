import { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';
import localizedString from '../i18n';

const replyToUser = async (interaction: ChatInputCommandInteraction, interactionOptions: InteractionReplyOptions) => {
  if (interaction.deferred || interaction.replied) {
    console.log('Interaction already replied/deferred.');
    await interaction.deleteReply();
    return await interaction.followUp({
      ...interactionOptions,
    });
  }

  return await interaction.reply({
    ...interactionOptions,
  });
};

const setVolume = async (
  interaction: ChatInputCommandInteraction,
  volume?: number,
  increase?: boolean,
  interactionOptions?: InteractionReplyOptions,
) => {
  const genericError = localizedString('global:genericError', {
    lng: interaction.locale,
  });
  if (!interaction.guildId) {
    console.log('GuildId is undefined');
    return await replyToUser(interaction, {
      ...interactionOptions,
      content: genericError,
      ephemeral: true,
    });
  }
  const queue = global.player.nodes.get(interaction.guildId);

  if (!queue) {
    const noMusicCurrentlyPlaying = localizedString('global:noMusicCurrentlyPlaying', {
      lng: interaction.locale,
    });
    return await replyToUser(interaction, {
      ...interactionOptions,
      ephemeral: true,
      content: noMusicCurrentlyPlaying,
    });
  }

  let vol = interaction.options.getNumber('volume') ?? queue.node.volume ?? 100;

  if (volume) {
    vol = increase ? vol + volume : vol - volume;
  }

  if (queue.node.volume === vol) {
    const volumeAlreadyTheSame = localizedString('global:volumeAlreadyTheSame', {
      lng: interaction.locale,
    });

    return await replyToUser(interaction, {
      ...interactionOptions,
      ephemeral: true,
      content: volumeAlreadyTheSame,
    });
  }

  const success = queue.node.setVolume(vol);
  const volumeHasBeenModifiedTo = localizedString('global:volumeHasBeenModifiedTo', {
    lng: interaction.locale,
    volume: vol,
  });

  return await replyToUser(interaction, {
    ...interactionOptions,
    content: success ? volumeHasBeenModifiedTo : genericError,
  });
};

export default setVolume;
