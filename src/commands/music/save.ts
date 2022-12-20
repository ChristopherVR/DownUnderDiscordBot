import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import i18next from 'i18next';
import { PlayerCommand } from '../../types';
import { getPlayer } from '../helpers/player';
import getLocalizations from '../i18n/discordLocalization';

export const Save: PlayerCommand = {
  name: i18next.t('global:save'),
  description: i18next.t('global:saveThisTrack'),
  nameLocalizations: getLocalizations('global:save'),
  descriptionLocalizations: getLocalizations('global:saveThisTrack'),
  voiceChannel: true,
  run: async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      const genericError = i18next.t('global:genericError', {
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
      const noMusicCurrentlyPlaying = i18next.t('global:noMusicCurrentlyPlaying', {
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
                name: `:hourglass: ${i18next.t('global:duration', { lng: interaction.locale })}`,
                value: `\`${queue.current.duration}\``,
                inline: true,
              },
              {
                name: i18next.t('global:songBy', { lng: interaction.locale }),
                value: `\`${queue.current.author}\``,
                inline: true,
              },
              {
                name: `${i18next.t('global:views', { lng: interaction.locale })} :eyes:`,
                value: `\`${Number(queue.current.views).toLocaleString()}\``,
                inline: true,
              },
              { name: i18next.t('global:songUrl', { lng: interaction.locale }), value: `\`${queue.current.url}\`` },
            )
            .setThumbnail(queue.current.thumbnail)
            .setFooter({
              text: `${i18next.t('global:fromTheServer', { lng: interaction.locale })} ${
                interaction.guild?.name ?? ''
              }`,
              iconURL: interaction.guild?.iconURL() ?? undefined,
            }),
        ],
      });

      const titleOfMusicPmSend = i18next.t('global:generictitleOfMusicPmSendError', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: titleOfMusicPmSend,
        ephemeral: true,
      });
    } catch {
      const unableToSendPrivateMessag = i18next.t('global:unableToSendPrivateMessag', {
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
