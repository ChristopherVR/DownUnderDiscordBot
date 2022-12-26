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
import { getPlayer } from '../helpers/player';
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
    const queue = getPlayer().getQueue(interaction.guildId);

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

    const timestamp = queue.getPlayerTimestamp();

    const trackDuration = timestamp.progress === Number.MAX_SAFE_INTEGER ? 'infinity (live)' : track.duration;

    const progress = queue.createProgressBar();

    const saveButton = new ButtonBuilder()
      .setLabel(
        localizedString('global:saveThisTrack', {
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
      .setStyle(ButtonStyle.Secondary);

    const volumedown = new ButtonBuilder()
      .setLabel(
        localizedString('global:volumeDown', {
          lng: interaction.locale,
        }),
      )
      .setCustomId(JSON.stringify({ ffb: 'volumedown' }))
      .setStyle(ButtonStyle.Secondary);

    const loop = new ButtonBuilder()
      .setLabel(
        localizedString('global:loop', {
          lng: interaction.locale,
        }),
      )
      .setCustomId(JSON.stringify({ ffb: 'loop' }))
      .setStyle(ButtonStyle.Secondary);

    const resumepause = new ButtonBuilder()
      .setLabel(
        localizedString('global:resumeAndPause', {
          lng: interaction.locale,
        }),
      )
      .setCustomId(JSON.stringify({ ffb: 'resume&pause' }))
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
      resumepause,
      loop,
      volumeup,
    );
    return await interaction.reply({ embeds: [embed], components: [row] });
  },
};

export default NowPlaying;
