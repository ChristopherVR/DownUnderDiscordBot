import {
  ActionRowBuilder,
  ApplicationCommandType,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
} from 'discord.js';
import { PlayerTimestamp } from 'discord-player';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { PlayerCommand } from '../../models/discord.js';

import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { useDefaultPlayer } from '../../helpers/discord/player.js';
import Pause from './pause.js';
import { NowPlayingAction } from '../../enums/nowplaying.js';
import Save from './save.js';
import { Loop } from './loop.js';
import { logger } from '../../helpers/logger/logger.js';
import { DefaultLoggerMessage } from '../../enums/logger.js';

export const NowPlaying: PlayerCommand = {
  name: localizedString('global:nowplaying'),
  description: localizedString('global:viewWhatIsPlaying'),
  nameLocalizations: getLocalizations('global:nowplaying'),
  descriptionLocalizations: getLocalizations('global:viewWhatIsPlaying'),

  type: ApplicationCommandType.ChatInput,

  run: async (interaction: ChatInputCommandInteraction) => {
    const { localize } = useLocalizedString(interaction.locale);
    if (!interaction.guildId) {
      const genericError = localize('global:genericError');
      logger(DefaultLoggerMessage.GuildIsNotDefined).error();
      return interaction.reply({
        content: genericError,
        ephemeral: true,
      });
    }
    const player = useDefaultPlayer();
    const queue = player.nodes.get(interaction.guildId);
    const track = queue?.currentTrack;
    if (!queue || !queue.isPlaying() || !track) {
      const noMusicCurrentlyPlaying = localize('global:noMusicCurrentlyPlaying');
      return interaction.reply({
        content: noMusicCurrentlyPlaying,
        ephemeral: true,
      });
    }
    const methods = ['disabled', 'track', 'queue'];

    let timestamp: PlayerTimestamp | null;
    try {
      timestamp = queue.node.getTimestamp();
    } catch {
      logger(DefaultLoggerMessage.UnableToRetrieveCurrentQueueTimestamp).error();
      return await interaction.followUp(localize('global:genericError'));
    }

    const trackDuration = timestamp?.progress === Number.MAX_SAFE_INTEGER ? 'infinity (live)' : track?.duration;

    const progress = queue.node.createProgressBar();

    const saveButton = new ButtonBuilder()
      .setLabel(localize('global:saveTrack'))
      .setCustomId(NowPlayingAction.SaveTrack)
      .setStyle(ButtonStyle.Success);

    const loop = new ButtonBuilder()
      .setLabel(localize('global:repeatCapitalise'))
      .setCustomId(NowPlayingAction.Loop)
      .setStyle(ButtonStyle.Primary);

    const pause = new ButtonBuilder()
      .setLabel(localize('global:pauseCapitalise'))
      .setCustomId(NowPlayingAction.Pause)
      .setStyle(ButtonStyle.Primary);

    const volDurationDesc = localize('global:nowPlayingDescription', {
      lng: interaction.locale,
      volume: queue.node.volume,
      duration: trackDuration,
      progress,
      mode: methods[queue.repeatMode],
      user: track?.requestedBy?.username,
    });

    const embed = new EmbedBuilder()
      .setAuthor({
        name: track?.title ?? '',
        iconURL: interaction.client.user?.displayAvatarURL({ size: 1024 }),
      })
      .setThumbnail(track?.thumbnail ?? '')
      .setDescription(volDurationDesc)
      .setFooter({
        text: localize('global:defaultFooter'),
        iconURL: interaction.member?.avatar ?? undefined,
      })
      .setColor(Colors.Default)
      .setTimestamp();
    const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(loop, pause, saveButton);

    if (interaction.channel?.type !== ChannelType.GuildText) {
      const response = localize('global:haveToSendToTextChannel');

      return interaction.followUp({
        content: response,
        ephemeral: true,
      });
    }

    const collector = interaction.channel.createMessageComponentCollector({
      time: 15000,
      filter: (m) => m.member.id === interaction.user.id,
    });

    collector.on('collect', async (inter) => {
      if ('customId' in inter && typeof inter.customId === 'string') {
        switch (inter.customId as NowPlayingAction) {
          case NowPlayingAction.Loop: {
            await interaction.deleteReply();
            await Loop.run(interaction);
            break;
          }
          case NowPlayingAction.Pause: {
            await interaction.deleteReply();
            await Pause.run(interaction);
            break;
          }
          case NowPlayingAction.SaveTrack: {
            await interaction.deleteReply();
            await Save.run(interaction);
            break;
          }
          default: {
            await interaction.followUp({
              content: localize('global:genericError'),
              ephemeral: true,
            });
            break;
          }
        }
      } else {
        logger('Custom id', inter.customId, ' does not exist on interaction: ', inter).error();
        await interaction.deleteReply();
        await interaction.followUp({
          content: localize('global:genericError'),
          ephemeral: true,
        });
      }
      collector.stop();
    });
    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  },
};

export default NowPlaying;
