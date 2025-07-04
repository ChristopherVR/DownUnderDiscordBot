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
  GuildMember,
} from 'discord.js';
import { PlayerTimestamp, QueueRepeatMode } from 'discord-player';
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
    try {
      if (!interaction.guildId || !interaction.guild) {
        logger(DefaultLoggerMessage.GuildIsNotDefined).error();
        return await interaction.reply({
          content: localize('global:genericError'),
          ephemeral: true,
        });
      }
      const player = useDefaultPlayer();
      const queue = player.nodes.get(interaction.guildId);
      const track = queue?.currentTrack;

      if (!queue || !queue.isPlaying() || !track) {
        return await interaction.reply({
          content: localize('global:noMusicCurrentlyPlaying'),
          ephemeral: true,
        });
      }

      const memberChannel = (interaction.member as GuildMember | null)?.voice.channel;
      if (!memberChannel || memberChannel.id !== queue.channel?.id) {
        return await interaction.reply({
          content: localize('global:mustBeInSameVoiceChannel'),
          ephemeral: true,
        });
      }

      if (interaction.channel?.type !== ChannelType.GuildText) {
        return await interaction.reply({
          content: localize('global:haveToSendToTextChannel'),
          ephemeral: true,
        });
      }

      let timestamp: PlayerTimestamp | null;
      try {
        timestamp = queue.node.getTimestamp();
      } catch {
        logger(DefaultLoggerMessage.UnableToRetrieveCurrentQueueTimestamp).error();
        return await interaction.reply({ content: localize('global:genericError'), ephemeral: true });
      }

      const trackDuration = timestamp?.progress === Number.MAX_SAFE_INTEGER ? 'infinity (live)' : track?.duration;
      const progress = queue.node.createProgressBar();
      const methods = ['disabled', 'track', 'queue', 'autoplay'];

      const generateEmbed = () => {
        const volDurationDesc = localize('global:nowPlayingDescription', {
          volume: queue.node.volume,
          duration: trackDuration,
          progress,
          mode: methods[queue.repeatMode],
          user: track?.requestedBy?.username,
        });

        return new EmbedBuilder()
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
      };

      const generateButtons = () => {
        const isPaused = queue.node.isPaused();
        return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel(localize('global:repeatCapitalise'))
            .setCustomId(NowPlayingAction.Loop)
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setLabel(isPaused ? localize('global:resumeCapitalise') : localize('global:pauseCapitalise'))
            .setCustomId(NowPlayingAction.Pause)
            .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Primary),
          new ButtonBuilder()
            .setLabel(localize('global:saveTrack'))
            .setCustomId(NowPlayingAction.SaveTrack)
            .setStyle(ButtonStyle.Success),
        );
      };

      const reply = await interaction.reply({
        embeds: [generateEmbed()],
        components: [generateButtons()],
        ephemeral: true,
      });

      const collector = reply.createMessageComponentCollector({
        time: 60000,
        filter: (m) => m.user.id === interaction.user.id,
      });

      collector.on('collect', async (inter) => {
        if (!inter.isButton()) return;

        switch (inter.customId as NowPlayingAction) {
          case NowPlayingAction.Loop:
            queue.setRepeatMode(((queue.repeatMode + 1) % 4) as QueueRepeatMode);
            break;
          case NowPlayingAction.Pause:
            queue.node.setPaused(!queue.node.isPaused());
            break;
          case NowPlayingAction.SaveTrack:
            {
              const dm = await interaction.user.createDM();
              await dm.send({
                content: localize('global:savedTrack', { title: track.title }),
              });
            }
            break;
        }
        await inter.update({
          embeds: [generateEmbed()],
          components: [generateButtons()],
        });
      });
    } catch (error) {
      if (error instanceof Error) {
        logger(error).error();
      } else {
        logger(String(error)).error();
      }
      if (interaction.replied || interaction.deferred) {
        return await interaction.followUp({
          content: localize('global:genericError'),
          ephemeral: true,
        });
      }
      return await interaction.reply({
        content: localize('global:genericError'),
        ephemeral: true,
      });
    }
  },
};

export default NowPlaying;
