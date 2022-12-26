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
import { localizedString } from '../../i18n';
import { PlayerCommand } from '../../types';
import getLocalizations from '../i18n/discordLocalization';

export const Controller: PlayerCommand = {
  name: localizedString('global:controller'),
  description: localizedString('global:setControllerChannel'),
  nameLocalizations: getLocalizations('global:controller'),
  descriptionLocalizations: getLocalizations('global:setControllerChannel'),
  voiceChannel: false,
  permissions: PermissionsBitField.Flags.ManageMessages,
  options: [
    {
      name: localizedString('global:controller'),
      description: localizedString('global:setTheChannelYouWantToSendTo'),
      descriptionLocalizations: getLocalizations('global:setTheChannelYouWantToSendTo'),
      nameLocalizations: getLocalizations('global:channel'),
      type: ApplicationCommandOptionType.Channel,
      required: true,
    },
  ],
  type: ApplicationCommandType.ChatInput,
  run: async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guild) {
      const genericError = localizedString('global:genericError', {
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
      const genericError = localizedString('global:genericError', {
        lng: interaction.locale,
      });
      console.log('channel is undefined');
      return await interaction.reply({
        content: genericError,
        ephemeral: true,
      });
    }
    if (channel.type !== 0) {
      const loc = localizedString('global:haveToSendToTextChannel', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: loc,
        ephemeral: true,
      });
    }

    if (!interaction.member) {
      console.log('member is undefined');
      const loc = localizedString('global:genericError', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: loc,
        ephemeral: true,
      });
    }

    const back = new ButtonBuilder()
      .setLabel(
        localizedString('global:back', {
          lng: interaction.locale,
        }),
      )
      .setCustomId(JSON.stringify({ ffb: 'back' }))
      .setStyle(ButtonStyle.Primary);

    const skip = new ButtonBuilder()
      .setLabel(
        localizedString('global:skip', {
          lng: interaction.locale,
        }),
      )
      .setCustomId(JSON.stringify({ ffb: 'skip' }))
      .setStyle(ButtonStyle.Primary);

    const resumepause = new ButtonBuilder()
      .setLabel(
        localizedString('global:resumeAndPause', {
          lng: interaction.locale,
        }),
      )
      .setCustomId(JSON.stringify({ ffb: 'resume&pause' }))
      .setStyle(ButtonStyle.Danger);

    const save = new ButtonBuilder()
      .setLabel(
        localizedString('global:save', {
          lng: interaction.locale,
        }),
      )
      .setCustomId(JSON.stringify({ ffb: 'savetrack' }))
      .setStyle(ButtonStyle.Success);

    const volumeup = new ButtonBuilder()
      .setLabel(
        localizedString('global:volumeUp', {
          lng: interaction.locale,
        }),
      )
      .setCustomId(JSON.stringify({ ffb: 'volumeup' }))
      .setStyle(ButtonStyle.Primary);

    const volumedown = new ButtonBuilder()
      .setLabel(
        localizedString('global:volumeDown', {
          lng: interaction.locale,
        }),
      )
      .setCustomId(JSON.stringify({ ffb: 'volumedown' }))
      .setStyle(ButtonStyle.Primary);

    const loop = new ButtonBuilder()
      .setLabel(
        localizedString('global:loop', {
          lng: interaction.locale,
        }),
      )
      .setCustomId(JSON.stringify({ ffb: 'loop' }))
      .setStyle(ButtonStyle.Danger);

    const np = new ButtonBuilder()
      .setLabel(
        localizedString('global:nowPlaying', {
          lng: interaction.locale,
        }),
      )
      .setCustomId(JSON.stringify({ ffb: 'nowplaying' }))
      .setStyle(ButtonStyle.Secondary);

    const queuebutton = new ButtonBuilder()
      .setLabel(
        localizedString('global:queue', {
          lng: interaction.locale,
        }),
      )
      .setCustomId(JSON.stringify({ ffb: 'queue' }))
      .setStyle(ButtonStyle.Secondary);

    const embed = new EmbedBuilder()
      .setTitle(
        localizedString('global:controlMusicWithButtonsBelow', {
          lng: interaction.locale,
        }),
      )
      .setImage(interaction.guild.iconURL({ size: 4096 }))
      .setColor('#36393e')
      .setFooter({
        text: localizedString('global:defaultFooter', {
          lng: interaction.locale,
        }),
        iconURL: interaction.member.avatar ?? undefined,
      });

    const loc = localizedString('global:genericError', {
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
