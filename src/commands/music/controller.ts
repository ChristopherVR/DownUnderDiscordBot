import {
  ApplicationCommandOptionType,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  PermissionsBitField,
  ApplicationCommandType,
  ButtonStyle,
  ChatInputCommandInteraction,
  MessageActionRowComponentBuilder,
} from 'discord.js';
import i18next from 'i18next';
import { PlayerCommand } from '../../types';
import getLocalizations from '../i18n/discordLocalization';

export const Controller: PlayerCommand = {
  name: i18next.t('global:controller'),
  description: i18next.t('global:setControllerChannel'),
  nameLocalizations: getLocalizations('global:controller'),
  descriptionLocalizations: getLocalizations('global:setControllerChannel'),
  voiceChannel: false,
  permissions: PermissionsBitField.Flags.ManageMessages,
  options: [
    {
      name: i18next.t('global:controller'),
      description: i18next.t('global:setTheChannelYouWantToSendTo'),
      descriptionLocalizations: getLocalizations('global:setTheChannelYouWantToSendTo'),
      nameLocalizations: getLocalizations('global:channel'),
      type: ApplicationCommandOptionType.Channel,
      required: true,
    },
  ],
  type: ApplicationCommandType.ChatInput,
  run: async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guild) {
      const genericError = i18next.t('global:genericError', {
        lng: interaction.locale,
      });
      console.log('GuildId is undefined');
      return await interaction.reply({
        content: genericError,
        ephemeral: true,
      });
    }
    const { channel } = interaction;
    // const channel = interaction.options.getChannel('channel');
    if (!channel) {
      const genericError = i18next.t('global:genericError', {
        lng: interaction.locale,
      });
      console.log('channel is undefined');
      return await interaction.reply({
        content: genericError,
        ephemeral: true,
      });
    }
    if (channel.type !== 0) {
      const loc = i18next.t('global:haveToSendToTextChannel', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: loc,
        ephemeral: true,
      });
    }

    if (!interaction.member) {
      console.log('member is undefined');
      const loc = i18next.t('global:genericError', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: loc,
        ephemeral: true,
      });
    }

    const back = new ButtonBuilder()
      .setLabel(
        i18next.t('global:back', {
          lng: interaction.locale,
        }),
      )
      .setCustomId(JSON.stringify({ ffb: 'back' }))
      .setStyle(ButtonStyle.Primary);

    const skip = new ButtonBuilder()
      .setLabel(
        i18next.t('global:skip', {
          lng: interaction.locale,
        }),
      )
      .setCustomId(JSON.stringify({ ffb: 'skip' }))
      .setStyle(ButtonStyle.Primary);

    const resumepause = new ButtonBuilder()
      .setLabel(
        i18next.t('global:resumeAndPause', {
          lng: interaction.locale,
        }),
      )
      .setCustomId(JSON.stringify({ ffb: 'resume&pause' }))
      .setStyle(ButtonStyle.Danger);

    const save = new ButtonBuilder()
      .setLabel(
        i18next.t('global:save', {
          lng: interaction.locale,
        }),
      )
      .setCustomId(JSON.stringify({ ffb: 'savetrack' }))
      .setStyle(ButtonStyle.Success);

    const volumeup = new ButtonBuilder()
      .setLabel(
        i18next.t('global:volumeUp', {
          lng: interaction.locale,
        }),
      )
      .setCustomId(JSON.stringify({ ffb: 'volumeup' }))
      .setStyle(ButtonStyle.Primary);

    const volumedown = new ButtonBuilder()
      .setLabel(
        i18next.t('global:volumeDown', {
          lng: interaction.locale,
        }),
      )
      .setCustomId(JSON.stringify({ ffb: 'volumedown' }))
      .setStyle(ButtonStyle.Primary);

    const loop = new ButtonBuilder()
      .setLabel(
        i18next.t('global:loop', {
          lng: interaction.locale,
        }),
      )
      .setCustomId(JSON.stringify({ ffb: 'loop' }))
      .setStyle(ButtonStyle.Danger);

    const np = new ButtonBuilder()
      .setLabel(
        i18next.t('global:nowPlaying', {
          lng: interaction.locale,
        }),
      )
      .setCustomId(JSON.stringify({ ffb: 'nowplaying' }))
      .setStyle(ButtonStyle.Secondary);

    const queuebutton = new ButtonBuilder()
      .setLabel(
        i18next.t('global:queue', {
          lng: interaction.locale,
        }),
      )
      .setCustomId(JSON.stringify({ ffb: 'queue' }))
      .setStyle(ButtonStyle.Secondary);

    const embed = new EmbedBuilder()
      .setTitle(
        i18next.t('global:controlMusicWithButtonsBelow', {
          lng: interaction.locale,
        }),
      )
      .setImage(interaction.guild.iconURL({ size: 4096 }))
      .setColor('#36393e')
      .setFooter({
        text: i18next.t('global:defaultFooter', {
          lng: interaction.locale,
        }),
        iconURL: interaction.member.avatar ?? undefined,
      });

    const loc = i18next.t('global:genericError', {
      lng: interaction.locale,
      name: channel.name,
    });
    await interaction.reply({
      content: loc,
      ephemeral: true,
    });

    const row1 = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      back,
      queuebutton,
      resumepause,
      np,
      skip,
    );
    const row2 = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      volumedown,
      loop,
      save,
      volumeup,
    );
    return await channel.send({ embeds: [embed], components: [row1, row2] });
  },
};

export default Controller;
