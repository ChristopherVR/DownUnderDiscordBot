import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { localizedString } from '../../i18n';
import { PlayerCommand } from '../../types';
import { getPlayer } from '../helpers/player';
import getLocalizations from '../i18n/discordLocalization';

export const Save: PlayerCommand = {
  name: localizedString('global:save'),
  description: localizedString('global:saveThisTrack'),
  nameLocalizations: getLocalizations('global:save'),
  descriptionLocalizations: getLocalizations('global:saveThisTrack'),
  voiceChannel: true,
  run: async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      const genericError = localizedString('global:genericError', {
        lng: interaction.locale,
      });
      console.log('GuildId is undefined');
      return await interaction.reply({
        content: genericError,
        ephemeral: true,
      });
    }
    const queue = getPlayer().getQueue(interaction.guildId);

    if (!queue) {
      const noMusicCurrentlyPlaying = localizedString('global:noMusicCurrentlyPlaying', {
        lng: interaction.locale,
      });
      return await interaction.reply({
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

      const titleOfMusicPmSend = localizedString('global:generictitleOfMusicPmSendError', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: titleOfMusicPmSend,
        ephemeral: true,
      });
    } catch {
      const unableToSendPrivateMessag = localizedString('global:unableToSendPrivateMessag', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: unableToSendPrivateMessag,
        ephemeral: true,
      });
    }
  },
};

export default Save;
