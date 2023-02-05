import { ChatInputCommandInteraction, EmbedBuilder, InteractionReplyOptions } from 'discord.js';
import localizedString from '../i18n';

const saveTrack = async (interaction: ChatInputCommandInteraction, interactionOptions?: InteractionReplyOptions) => {
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
    const noMusicCurrentlyPlaying = localizedString('global:noMusicCurrentlyPlaying', {
      lng: interaction.locale,
    });
    return await interaction.reply({
      ...interactionOptions,
      content: noMusicCurrentlyPlaying,
      ephemeral: true,
    });
  }

  try {
    await interaction.user.send({
      embeds: [
        new EmbedBuilder()
          .setColor('Red')
          .setTitle(`:arrow_forward: ${queue.current.title}`)
          .setURL(queue.current.url)
          .addFields(
            {
              name: `:hourglass: ${localizedString('global:duration', { lng: interaction.locale })}`,
              value: `\`${queue.current.duration}\``,
              inline: true,
            },
            {
              name: localizedString('global:songBy', { lng: interaction.locale }),
              value: `\`${queue.current.author}\``,
              inline: true,
            },
            {
              name: `${localizedString('global:views', { lng: interaction.locale })} :eyes:`,
              value: `\`${Number(queue.current.views).toLocaleString()}\``,
              inline: true,
            },
            {
              name: localizedString('global:songUrl', { lng: interaction.locale }),
              value: `\`${queue.current.url}\``,
            },
          )
          .setThumbnail(queue.current.thumbnail)
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
    return await interaction.reply({
      ...interactionOptions,
      content: titleOfMusicPmSend,
      ephemeral: true,
    });
  } catch {
    const unableToSendPrivateMessag = localizedString('global:unableToSendPrivateMessag', {
      lng: interaction.locale,
    });
    return await interaction.reply({
      ...interactionOptions,
      content: unableToSendPrivateMessag,
      ephemeral: true,
    });
  }
};

export default saveTrack;
