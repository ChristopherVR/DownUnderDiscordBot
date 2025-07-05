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
  MessageFlags,
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
        logger.error('Guild is not defined.');
        return await interaction.reply({
          content: localize('global:genericError'),
          flags: MessageFlags.Ephemeral,
        });
      }
      const player = useDefaultPlayer();
      const queue = player.nodes.get(interaction.guildId);
      const track = queue?.currentTrack;

      if (!queue || !queue.isPlaying() || !track) {
        return await interaction.reply({
          content: localize('global:noMusicCurrentlyPlaying'),
          flags: MessageFlags.Ephemeral,
        });
      }

      const memberChannel = (interaction.member as GuildMember | null)?.voice.channel;
      if (!memberChannel || memberChannel.id !== queue.channel?.id) {
        return await interaction.reply({
          content: localize('global:mustBeInSameVoiceChannel'),
          flags: MessageFlags.Ephemeral,
        });
      }

      if (interaction.channel?.type !== ChannelType.GuildText) {
        return await interaction.reply({
          content: localize('global:haveToSendToTextChannel'),
          flags: MessageFlags.Ephemeral,
        });
      }

      let timestamp: PlayerTimestamp | null;
      try {
        timestamp = queue.node.getTimestamp();
      } catch {
        logger.error('Unable to retrieve current queue timestamp.');
        return await interaction.reply({ content: localize('global:genericError'), flags: MessageFlags.Ephemeral });
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

      await interaction.reply({
        embeds: [generateEmbed()],
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      logger.error(error);
      if (interaction.replied || interaction.deferred) {
        return await interaction.followUp({
          content: localize('global:genericError'),
          flags: MessageFlags.Ephemeral,
        });
      }
      return await interaction.reply({
        content: localize('global:genericError'),
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

export default NowPlaying;
