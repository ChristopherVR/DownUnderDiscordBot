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
import { localizedString } from '../../helpers/localization';
import { PlayerCommand } from '../../types';
import setLoop from '../../utilities/loopHandler';
import pauseTrack from '../../utilities/pauseHandler';
import saveTrack from '../../utilities/saveTrackHandler';

import getLocalizations from '../../helpers/multiMapLocalization';
import { useDefaultPlayer } from '../../helpers/discord';

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
    const player = await useDefaultPlayer();
    const queue = player.nodes.get(interaction.guildId);

    if (!queue || !queue.isPlaying()) {
      const noMusicCurrentlyPlaying = localizedString('global:noMusicCurrentlyPlaying', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: noMusicCurrentlyPlaying,
        ephemeral: true,
      });
    }

    const track = queue.currentTrack;

    const methods = ['disabled', 'track', 'queue'];

    let timestamp: PlayerTimestamp | null;
    try {
      timestamp = queue.node.getTimestamp();
    } catch {
      return await interaction.followUp(
        localizedString('global:genericError', {
          lng: interaction.locale,
        }),
      );
    }

    const trackDuration = timestamp?.progress === Number.MAX_SAFE_INTEGER ? 'infinity (live)' : track?.duration;

    const progress = queue.node.createProgressBar();

    const saveButton = new ButtonBuilder()
      .setLabel(
        localizedString('global:saveTrack', {
          lng: interaction.locale,
        }),
      )
      .setCustomId('savetrack')
      .setStyle(ButtonStyle.Success);

    const loop = new ButtonBuilder()
      .setLabel(
        localizedString('global:repeatCapitalise', {
          lng: interaction.locale,
        }),
      )
      .setCustomId('loop')
      .setStyle(ButtonStyle.Primary);

    const pause = new ButtonBuilder()
      .setLabel(
        localizedString('global:pauseCapitalise', {
          lng: interaction.locale,
        }),
      )
      .setCustomId('pause')
      .setStyle(ButtonStyle.Primary);

    const volDurationDesc = localizedString('global:nowPlayingDescription', {
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
        text: localizedString('global:defaultFooter', {
          lng: interaction.locale,
        }),

        iconURL: interaction.member?.avatar ?? undefined,
      })
      .setColor(Colors.Default)
      .setTimestamp();
    const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(loop, pause, saveButton);

    if (interaction.channel?.type !== ChannelType.GuildText) {
      throw new Error('Channel Type needs to be GuildText');
    }
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

    collector.on('collect', async (inter) => {
      if ('customId' in inter && typeof inter.customId === 'string') {
        switch (inter.customId) {
          case 'loop': {
            await setLoop(interaction, 'enable_loop_song', async (obj) => {
              await interaction.deleteReply();
              return interaction.followUp(obj);
            });
            break;
          }
          case 'pause': {
            await pauseTrack(interaction, async (obj) => {
              await interaction.deleteReply();
              return interaction.followUp(obj);
            });
            break;
          }
          case 'savetrack': {
            await saveTrack(interaction, async (obj) => {
              await interaction.deleteReply();
              return interaction.followUp(obj);
            });
            break;
          }
          default: {
            await interaction.followUp({
              content: localizedString('global:genericError', { lng: interaction.locale }),
              ephemeral: true,
            });
            break;
          }
        }
      } else {
        console.log('custom id does not exist on interaction: ', inter);
      }
      collector.stop();
    });
    return await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  },
};

export default NowPlaying;
