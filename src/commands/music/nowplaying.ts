import {
  ActionRowBuilder,
  ApplicationCommandType,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
} from 'discord.js';
import { localizedString } from '../../i18n';
import { PlayerCommand } from '../../types';

import getLocalizations from '../i18n/discordLocalization';

export const NowPlaying: PlayerCommand = {
  name: localizedString('global:nowplaying'),
  description: localizedString('global:viewWhatIsPlaying'),
  nameLocalizations: getLocalizations('global:nowplaying'),
  descriptionLocalizations: getLocalizations('global:viewWhatIsPlaying'),
  voiceChannel: true,

  type: ApplicationCommandType.ChatInput,

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
    const queue = global.player.getQueue(interaction.guildId);

    if (!queue) {
      const noMusicCurrentlyPlaying = localizedString('global:noMusicCurrentlyPlaying', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: noMusicCurrentlyPlaying,
        ephemeral: true,
      });
    }

    const track = queue.current;

    const methods = ['disabled', 'track', 'queue'];

    let timestamp: {
      current: string;
      end: string;
      progress: number;
    };
    try {
      timestamp = queue.getPlayerTimestamp();
    } catch {
      return await interaction.followUp(
        localizedString('global:genericError', {
          lng: interaction.locale,
        }),
      );
    }

    const trackDuration = timestamp.progress === Number.MAX_SAFE_INTEGER ? 'infinity (live)' : track.duration;

    const progress = queue.createProgressBar();

    const saveButton = new ButtonBuilder()
      .setLabel(
        localizedString('global:saveTrack', {
          lng: interaction.locale,
        }),
      )
      .setCustomId('savetrack')
      .setStyle(ButtonStyle.Success);

    const volumeup = new ButtonBuilder()
      .setLabel(
        localizedString('global:volumeUp', {
          lng: interaction.locale,
        }),
      )
      .setCustomId('volumeup')
      .setStyle(ButtonStyle.Secondary);

    const volumedown = new ButtonBuilder()
      .setLabel(
        localizedString('global:volumeDown', {
          lng: interaction.locale,
        }),
      )
      .setCustomId('volumedown')
      .setStyle(ButtonStyle.Secondary);

    const loop = new ButtonBuilder()
      .setLabel(
        localizedString('global:repeatCapitalise', {
          lng: interaction.locale,
        }),
      )
      .setCustomId('loop')
      .setStyle(ButtonStyle.Secondary);

    const resumePause = new ButtonBuilder()
      .setLabel(
        localizedString('global:pause', {
          lng: interaction.locale,
        }),
      )
      .setCustomId('pause_resume')
      .setStyle(ButtonStyle.Primary);

    const volDurationDesc = localizedString('global:nowPlayingDescription', {
      lng: interaction.locale,
      volume: queue.volume,
      duration: trackDuration,
      progress,
      mode: methods[queue.repeatMode],
      user: track.requestedBy.username,
    });

    const embed = new EmbedBuilder()
      .setAuthor({
        name: track.title,
        iconURL: interaction.client.user?.displayAvatarURL({ size: 1024 }),
      })
      .setThumbnail(track.thumbnail)
      .setDescription(volDurationDesc)
      .setFooter({
        text: localizedString('global:defaultFooter', {
          lng: interaction.locale,
        }),

        iconURL: interaction.member?.avatar ?? undefined,
      })
      .setColor(Colors.Default)
      .setTimestamp();
    const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      volumedown,
      saveButton,
      resumePause,
      loop,
      volumeup,
    );

    // TODO: Helper functions to handle collectors?
    const collector = interaction.channel?.createMessageComponentCollector({
      time: 15000,
      // max: 1,
      filter: (m) => m.member.id === interaction.user.id,
    });

    if (!collector) {
      console.log('Collector is undefined');
      return await interaction.followUp({
        content: localizedString('global:genericError', { lng: interaction.locale }),
        ephemeral: true,
      });
    }

    collector.on('collect', (inter) => {
      if ('customId' in inter && typeof inter.customId === 'string') {
        switch (inter.customId) {
          case 'volumedown': {
            break;
          }
          case 'loop': {
            break;
          }
          case 'pause_resume': {
            break;
          }
          case 'volumeup': {
            break;
          }
          case 'savetrack': {
            break;
          }
          default: {
            break;
          }
        }
      } else {
        console.log('custom id does not exist on interaction: ', inter);
      }
    });
    return await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  },
};

export default NowPlaying;
