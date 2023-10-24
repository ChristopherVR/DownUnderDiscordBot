import { QueryType } from 'discord-player';
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  MessageActionRowComponentBuilder,
} from 'discord.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { PlayerCommand } from '../../models/discord.js';

import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { useDefaultPlayer } from '../../helpers/discord/player.js';
import { ColletorType } from '../../enums/collector.js';
import { logger } from '../../helpers/logger/logger.js';
import { DefaultLoggerMessage } from '../../enums/logger.js';

export const Play: PlayerCommand = {
  name: localizedString('global:play'),
  description: localizedString('global:playTrackOrPlaylistByProviding'),
  nameLocalizations: getLocalizations('global:play'),
  descriptionLocalizations: getLocalizations('global:playTrackOrPlaylistByProviding'),

  options: [
    {
      name: localizedString('global:linkOrQuery'),
      description: localizedString('global:theSongToSearch'),
      nameLocalizations: getLocalizations('global:linkOrQuery'),
      descriptionLocalizations: getLocalizations('global:theSongToSearch'),
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  run: async (interaction: ChatInputCommandInteraction) => {
    const { localize } = useLocalizedString(interaction.locale);

    if (!interaction.guildId) {
      logger(DefaultLoggerMessage.GuildIsNotDefined).error();
      return interaction.reply({
        content: localize('global:genericError'),
        ephemeral: true,
      });
    }
    const userInput = interaction.options.getString(localize('global:linkOrQuery'));

    if (!userInput) {
      return interaction.reply({
        content: localize('global:genericError', {
          lng: interaction.locale,
        }),
        ephemeral: true,
      });
    }
    const player = useDefaultPlayer();
    await interaction.deferReply();
    const res = await player.search(userInput, {
      requestedBy: interaction.member as GuildMember,
      ignoreCache: true,
      searchEngine: QueryType.YOUTUBE,
    });

    if (!res.tracks.length) {
      logger(DefaultLoggerMessage.SomethingWentWrongTryingToFindTrack, res).error();
      return interaction.reply({
        content: localize('global:genericError', {
          lng: interaction.locale,
        }),
        ephemeral: true,
      });
    }

    if (!interaction.guild) {
      logger(DefaultLoggerMessage.GuildNotAvailableInteraction).error();
      return interaction.reply({
        content: localize('global:genericError', {
          lng: interaction.locale,
        }),
        ephemeral: true,
      });
    }

    const queue =
      player.nodes.get(interaction.guild) ??
      player.nodes.create(interaction.guild, {
        metadata: {
          channel: interaction.channel,
          client: interaction.guild?.members.me,
          requestedBy: interaction.user.username,
        },
        leaveOnEmptyCooldown: 300000,
        leaveOnEmpty: true,
        leaveOnEnd: false,
        bufferingTimeout: 0,
        volume: 65,
      });

    const maxTracks = res.tracks.slice(0, 5);

    const embed = new EmbedBuilder()
      .setColor('Random')
      .setAuthor({
        name: localizedString('global:resultsFor', { track: userInput, lng: interaction.locale }),
        iconURL: interaction.client.user?.displayAvatarURL({ size: 1024 }),
      })
      .setDescription(
        `${maxTracks.map((track, i) => `**${i + 1}**. ${track.title} | ${track.author}`).join('\n')}\n\n${localize(
          'global:selectAChoiceBetween',
          {
            lng: interaction.locale,
            count: maxTracks.length - 1,
          },
        )}`,
      )
      .setTimestamp()
      .setFooter({
        text: localize('global:defaultFooter'),
        iconURL: interaction.member?.avatar ?? undefined,
      });

    const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      ...[...Array(4).keys()].map((y) => {
        const label = (1 + y).toString();
        return new ButtonBuilder().setLabel(label).setCustomId(label).setStyle(ButtonStyle.Primary);
      }),
      new ButtonBuilder().setLabel(localize('global:cancel')).setCustomId('cancel').setStyle(ButtonStyle.Secondary),
    );

    await interaction.followUp({ embeds: [embed], components: [row] });

    if (interaction.channel?.type !== ChannelType.GuildText) {
      return interaction.reply({
        content: localize('global:channelMustBeGuildText', {
          lng: interaction.locale,
        }),
        ephemeral: true,
      });
    }

    const collector = interaction.channel.createMessageComponentCollector({
      time: 15000,
      max: 1,
      filter: (m) => m.member.id === interaction.user.id,
      // componentType: ComponentType.UserSelect,
      //maxUsers: 1,
    });

    const playSong = async (content: string) => {
      if (content === 'cancel') {
        await interaction.deleteReply();
        await interaction.followUp({
          content: localize('global:searchCancelled'),
          ephemeral: true,
        });
        collector.stop();
        if (queue.connection && !queue.deleted) {
          queue.delete();
        }
        return;
      }
      const value = parseInt(content, 10);

      if (!(value >= 0 || value < maxTracks.length)) {
        await interaction.deleteReply();
        return interaction.followUp({
          content: localize('global:invalidResponseForSong', {
            max: maxTracks.length - 1,
            lng: interaction.locale,
          }),
          ephemeral: true,
        });
      }
      const userChannel = interaction.guild?.members.cache.get(interaction.member?.user?.id ?? '')?.voice.channel;

      if (!userChannel) {
        logger(`User ${interaction.member?.user.username} is not connected to a voice channel.`);

        await interaction.deleteReply();
        return interaction.followUp({
          content: localize('global:connectToVoiceChannelToUseBot'),
          ephemeral: true,
        });
      }

      const track = res.tracks[Number(content) - 1];
      if (queue.channel?.id !== userChannel.id) {
        await queue.connect(userChannel);
      }

      const em = new EmbedBuilder()
        .setAuthor({
          name: localizedString('global:songAddedToQueue'),
        })
        .setDescription(`[${track.title}](${track.url})`)
        .setColor('Random');
      await interaction.deleteReply();
      await interaction.followUp({
        embeds: [em],
      });
      await queue.node.play(track, { queue: queue.isPlaying() });

      logger(`Playing track ${track.title} with URL: ${track.url}`).debug();
    };

    collector.on(ColletorType.Collect, async (inter) => {
      if ('customId' in inter && typeof inter.customId === 'string') {
        await playSong(inter.customId);
      } else {
        await interaction.deleteReply();
        await interaction.followUp({
          content: localize('global:invalidResponseReceived', {
            lng: interaction.locale,
          }),
          ephemeral: true,
        });
        collector.stop();
        collector.dispose(inter);
      }
    });

    collector.on(ColletorType.End, async (_, msg: string) => {
      if (msg === 'time') {
        await interaction.deleteReply();
        await interaction.followUp({
          content: localize('global:searchTimedOut', {
            lng: interaction.locale,
          }),
          ephemeral: true,
        });
      }
    });
  },
};
export default Play;
