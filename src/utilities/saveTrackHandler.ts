import { ChatInputCommandInteraction, EmbedBuilder, InteractionResponse, Message } from 'discord.js';
import { useDefaultPlayer } from '../helpers/discord';
import localizedString from '../helpers/localization';

const saveTrack = async (
  interaction: ChatInputCommandInteraction,
  response: (
    options: object,
  ) => Promise<InteractionResponse<boolean> | Message<boolean> | undefined> | Promise<void> | Awaited<void> | void,
) => {
  const genericError = localizedString('global:genericError', {
    lng: interaction.locale,
  });
  if (!interaction.guildId) {
    console.log('GuildId is undefined');
    return await response({
      content: genericError,
      ephemeral: true,
    });
  }
  const player = useDefaultPlayer();
  const queue = player.nodes.get(interaction.guildId);

  if (!queue) {
    const noMusicCurrentlyPlaying = localizedString('global:noMusicCurrentlyPlaying', {
      lng: interaction.locale,
    });
    return await response({
      content: noMusicCurrentlyPlaying,
      ephemeral: true,
    });
  }

  if (!queue.currentTrack) {
    return await response({
      content: genericError,
      ephemeral: true,
    });
  }

  try {
    await interaction.user.send({
      embeds: [
        new EmbedBuilder()
          .setColor('Red')
          .setTitle(`:arrow_forward: ${queue.currentTrack.title}`)
          .setURL(queue.currentTrack.url)
          .addFields(
            {
              name: `:hourglass: ${localizedString('global:duration', { lng: interaction.locale })}`,
              value: `\`${queue.currentTrack.duration}\``,
              inline: true,
            },
            {
              name: localizedString('global:songBy', { lng: interaction.locale }),
              value: `\`${queue.currentTrack.author}\``,
              inline: true,
            },
            {
              name: `${localizedString('global:views', { lng: interaction.locale })} :eyes:`,
              value: `\`${Number(queue.currentTrack.views).toLocaleString()}\``,
              inline: true,
            },
            {
              name: localizedString('global:songUrl', { lng: interaction.locale }),
              value: `\`${queue.currentTrack.url}\``,
            },
          )
          .setThumbnail(queue.currentTrack.thumbnail)
          .setFooter({
            text: `${localizedString('global:fromTheServer', { lng: interaction.locale })} ${
              interaction.guild?.name ?? ''
            }`,
            iconURL: interaction.guild?.iconURL() ?? undefined,
          }),
      ],
    });

    const titleOfMusicPmSend = localizedString('global:titleOfMusicPmSend', {
      lng: interaction.locale,
    });
    return await response({
      content: titleOfMusicPmSend,
      ephemeral: true,
    });
  } catch {
    const unableToSendPrivateMessag = localizedString('global:unableToSendPrivateMessag', {
      lng: interaction.locale,
    });
    return await response({
      content: unableToSendPrivateMessag,
      ephemeral: true,
    });
  }
};

export default saveTrack;
