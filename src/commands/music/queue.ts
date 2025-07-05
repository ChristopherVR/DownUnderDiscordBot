import {
  ActionRowBuilder,
  ApplicationCommandType,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  GuildMember,
  MessageActionRowComponentBuilder,
  MessageFlags,
} from 'discord.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { PlayerCommand } from '../../models/discord.js';

import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { useDefaultPlayer } from '../../helpers/discord/player.js';
import { logger } from '../../helpers/logger/logger.js';
import { Track } from 'discord-player';

export const Queue: PlayerCommand = {
  name: localizedString('global:queue'),
  description: localizedString('global:getSongsFromQueue'),
  nameLocalizations: getLocalizations('global:queue'),
  descriptionLocalizations: getLocalizations('global:getSongsFromQueue'),
  type: ApplicationCommandType.ChatInput,

  run: async (interaction: ChatInputCommandInteraction) => {
    const { localize } = useLocalizedString(interaction.locale);
    try {
      if (!interaction.guildId || !interaction.guild) {
        logger.error('Guild is not defined.');
        return await interaction.reply({ content: localize('global:genericError'), flags: MessageFlags.Ephemeral });
      }

      const player = useDefaultPlayer();
      const queue = player.nodes.get(interaction.guildId);

      if (!queue || !queue.isPlaying()) {
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

      if (queue.tracks.data.length === 0) {
        return await interaction.reply({ content: localize('global:noTrackInQueue'), flags: MessageFlags.Ephemeral });
      }

      const methods = ['📴', '🔂', '🔁', '▶️'];
      const tracks = queue.tracks.data;
      const totalPages = Math.ceil(tracks.length / 10);
      let currentPage = 0;

      const generateEmbed = (page: number) => {
        const start = page * 10;
        const end = start + 10;
        const currentTracks = tracks.slice(start, end);

        const tracksDescription = currentTracks
          .map(
            (track: Track, i: number) =>
              `**${start + i + 1}**. ${track.title} | ${track.author} - ${localize('global:requestedBy', {
                by: track.requestedBy?.username,
              })}`,
          )
          .join('\n');

        const severQueue = localize('global:severQueue', {
          guild: interaction.guild?.name ?? '',
          value: methods[queue.repeatMode],
        });

        return new EmbedBuilder()
          .setColor(Colors.Default)
          .setThumbnail(interaction.guild?.iconURL({ size: 2048 }) ?? null)
          .setAuthor({ name: severQueue, iconURL: interaction.client.user?.displayAvatarURL({ size: 1024 }) })
          .setDescription(`**${localize('global:current')}:** ${queue.currentTrack?.title}\n\n${tracksDescription}`)
          .setTimestamp()
          .setFooter({
            text: `${localize('global:page')} ${page + 1} / ${totalPages}`,
            iconURL: interaction.member?.avatar ?? undefined,
          });
      };

      const generateButtons = (page: number) => {
        return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('first_page')
            .setLabel('⏪')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId('prev_page')
            .setLabel('⬅️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId('next_page')
            .setLabel('➡️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page >= totalPages - 1),
          new ButtonBuilder()
            .setCustomId('last_page')
            .setLabel('⏩')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page >= totalPages - 1),
        );
      };

      const reply = await interaction.reply({
        embeds: [generateEmbed(currentPage)],
        components: [generateButtons(currentPage)],
        flags: MessageFlags.Ephemeral,
      });

      const collector = reply.createMessageComponentCollector({
        time: 60000,
        filter: (m) => m.user.id === interaction.user.id,
      });

      collector.on('collect', async (inter) => {
        if (!inter.isButton()) return;

        switch (inter.customId) {
          case 'first_page':
            currentPage = 0;
            break;
          case 'prev_page':
            currentPage--;
            break;
          case 'next_page':
            currentPage++;
            break;
          case 'last_page':
            currentPage = totalPages - 1;
            break;
        }

        await inter.update({
          embeds: [generateEmbed(currentPage)],
          components: [generateButtons(currentPage)],
        });
      });
    } catch (error) {
      logger.error(error);
      if (interaction.replied || interaction.deferred) {
        return await interaction.followUp({
          content: localize('global:genericError'),
          flags: MessageFlags.Ephemeral,
        });
      }
      return await interaction.reply({ content: localize('global:genericError'), flags: MessageFlags.Ephemeral });
    }
  },
};

export default Queue;
