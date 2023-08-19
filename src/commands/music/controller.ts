import {
  ApplicationCommandOptionType,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  ApplicationCommandType,
  ButtonStyle,
  ChatInputCommandInteraction,
  MessageActionRowComponentBuilder,
  ChannelType,
} from 'discord.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { PlayerCommand } from '../../models/discord.js';
import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { ControllerAction } from '../../enums/controller.js';
import { useDefaultPlayer } from '../../helpers/discord/player.js';
import { logger } from '../../helpers/logger/logger.js';
import { VolumeInputInteraction } from '../../models/commands/volume.js';
import { DefaultLoggerMessage } from '../../constants/logger.js';

export const Controller: PlayerCommand = {
  name: localizedString('global:controller'),
  description: localizedString('global:setControllerChannel'),
  nameLocalizations: getLocalizations('global:controller'),
  descriptionLocalizations: getLocalizations('global:setControllerChannel'),

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
    const { localize } = useLocalizedString(interaction.locale);
    if (!interaction.guild) {
      const genericError = localize('global:genericError');
      logger(DefaultLoggerMessage.GuildIsNotDefined).error();
      return await interaction.reply({
        content: genericError,
        ephemeral: true,
      });
    }
    const { channel } = interaction;
    if (!channel) {
      const genericError = localize('global:noChannelFound');
      logger(DefaultLoggerMessage.UnableToFindChannelToControl).error();
      return await interaction.reply({
        content: genericError,
        ephemeral: true,
      });
    }
    if (channel.type !== ChannelType.GuildText) {
      const response = localize('global:haveToSendToTextChannel');
      return await interaction.reply({
        content: response,
        ephemeral: true,
      });
    }

    if (!interaction.member) {
      const response = localize('global:genericError');
      return await interaction.reply({
        content: response,
        ephemeral: true,
      });
    }

    const back = new ButtonBuilder()
      .setLabel(localize('global:back'))
      .setCustomId(ControllerAction.Back)
      .setStyle(ButtonStyle.Primary);

    const skip = new ButtonBuilder()
      .setLabel(localize('global:skip'))
      .setCustomId(ControllerAction.Skip)
      .setStyle(ButtonStyle.Primary);

    const resumepause = new ButtonBuilder()
      .setLabel(localize('global:resumeAndPause'))
      .setCustomId(ControllerAction.ResumePause)
      .setStyle(ButtonStyle.Danger);

    const save = new ButtonBuilder()
      .setLabel(localize('global:save'))
      .setCustomId(ControllerAction.Save)
      .setStyle(ButtonStyle.Success);

    const volumeup = new ButtonBuilder()
      .setLabel(localize('global:volumeUp'))
      .setCustomId(ControllerAction.VolumeUp)
      .setStyle(ButtonStyle.Primary);

    const volumedown = new ButtonBuilder()
      .setLabel(localize('global:volumeDown'))
      .setCustomId(ControllerAction.VolumeDown)
      .setStyle(ButtonStyle.Primary);

    const loop = new ButtonBuilder().setLabel(localize('global:loop')).setCustomId('loop').setStyle(ButtonStyle.Danger);

    const np = new ButtonBuilder()
      .setLabel(localize('global:nowPlaying'))
      .setCustomId(ControllerAction.NowPlaying)
      .setStyle(ButtonStyle.Secondary);

    const queuebutton = new ButtonBuilder()
      .setLabel(localize('global:queue'))
      .setCustomId(ControllerAction.Queue)
      .setStyle(ButtonStyle.Secondary);

    const embed = new EmbedBuilder()
      .setTitle(localize('global:controlMusicWithButtonsBelow'))
      .setImage(interaction.guild.iconURL({ size: 4096 }))
      .setColor('Random')
      .setFooter({
        text: localize('global:defaultFooter'),
        iconURL: interaction.member.avatar ?? undefined,
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

    const collector = interaction.channel!.createMessageComponentCollector({
      time: 15000,
      filter: (m) => m.member.id === interaction.user.id,
    });

    collector.on('collect', async (inter) => {
      if ('customId' in inter && typeof inter.customId === 'string') {
        const { command } = await import('../../helpers/discord/command.js');
        let commandName: string | undefined;
        await interaction.deleteReply();
        switch (inter.customId as ControllerAction) {
          case ControllerAction.Back: {
            commandName = localizedString('global:back');
            break;
          }
          case ControllerAction.Skip: {
            commandName = localizedString('global:skip');
            break;
          }
          case ControllerAction.Save: {
            commandName = localizedString('global:save');
            break;
          }
          case ControllerAction.ResumePause: {
            const player = await useDefaultPlayer();
            const queue = player.nodes.get(interaction.guildId!);
            commandName = queue?.isPlaying() ? localizedString('global:pause') : localizedString('global:resume');
            break;
          }
          case ControllerAction.VolumeUp: {
            await command(localizedString('global:volumeUp'))
              .setup({ ...interaction, volume: 40, increase: true } as VolumeInputInteraction)
              .run();
            break;
          }
          case ControllerAction.VolumeDown: {
            await command(localizedString('global:volumeDown'))
              .setup({ ...interaction, volume: 40, increase: true } as VolumeInputInteraction)
              .run();
            break;
          }
          case ControllerAction.NowPlaying: {
            commandName = localizedString('global:nowplaying');
            break;
          }
          case ControllerAction.Queue: {
            commandName = localizedString('global:queue');
            break;
          }
        }
        if (commandName) {
          await command(commandName).setup(interaction).run();
        }
      }

      collector.stop();
    });

    await channel.send({ embeds: [embed], components: [row1, row2] });
  },
};

export default Controller;
