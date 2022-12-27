import { QueryType } from 'discord-player';
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Events,
  MessageActionRowComponentBuilder,
  User,
} from 'discord.js';
import { localizedString } from '../../i18n';
import { PlayerCommand } from '../../types';
import cast from '../helpers/cast';

import getLocalizations from '../i18n/discordLocalization';

export const Play: PlayerCommand = {
  name: localizedString('global:play'),
  description: localizedString('global:playTrackOrPlaylistByProviding'),
  nameLocalizations: getLocalizations('global:play'),
  descriptionLocalizations: getLocalizations('global:playTrackOrPlaylistByProviding'),
  voiceChannel: true,
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
  // eslint-disable-next-line consistent-return
  run: async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      console.log('GuildId is undefined');
      return await interaction.reply({
        content: localizedString('global:genericError', {
          lng: interaction.locale,
        }),
        ephemeral: true,
      });
    }
    const song = interaction.options.getString(localizedString('global:linkOrQuery')) ?? '';

    console.log(song);
    const res = await global.player.search(song, {
      requestedBy: cast<User>(interaction.member),
      searchEngine: QueryType.AUTO,
    });

    if (!res?.tracks?.length) {
      console.log('Something went wrong trying to find tracks. Object: ', res);
      return await interaction.reply({
        content: localizedString('global:genericError', {
          lng: interaction.locale,
          user: interaction.member?.user.username,
        }),
        ephemeral: true,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const queue = global.player.createQueue(interaction.guild!, {
      metadata: interaction.channel,
      leaveOnEnd: false,
    });
    const maxTracks = res.tracks.slice(0, 5);

    const embed = new EmbedBuilder()
      .setColor('#ff0000')
      .setAuthor({
        name: localizedString('global:resultsFor', { song }),
        iconURL: interaction.client.user?.displayAvatarURL({ size: 1024 }),
      })
      .setDescription(
        `${maxTracks
          .map((track, i) => `**${i + 1}**. ${track.title} | ${track.author}`)
          .join('\n')}\n\n${localizedString('global:selectAChoiceBetween', {
          count: maxTracks.length,
        })}`,
      )
      .setTimestamp()
      .setFooter({
        text: localizedString('global:defaultFooter'),
        iconURL: interaction.member?.avatar ?? undefined,
      });

    const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      ...[...Array(4).keys()].map((y) => {
        const label = (1 + y).toString();
        return new ButtonBuilder().setLabel(label).setCustomId(label).setStyle(ButtonStyle.Primary);
      }),
      new ButtonBuilder()
        .setLabel(localizedString('global:cancel'))
        .setCustomId('cancel')
        .setStyle(ButtonStyle.Secondary),
    );
    await interaction.reply({ embeds: [embed], components: [row] });

    const collector = interaction.channel?.createMessageCollector({
      time: 15000,
      max: 1,
      filter: (m) => m.author.id === interaction.member?.user.id,
    });

    const playSong = async (content: string) => {
      const value = parseInt(content ?? '', 10);
      if (!value || value <= 0 || value > maxTracks.length) {
        await interaction.followUp({
          content: localizedString('global:invalidResponseForSong', { max: maxTracks.length }),
          ephemeral: true,
        });
      } else {
        collector?.stop();

        try {
          if (!queue.connection) {
            const channel = interaction.guild?.members.cache.get(interaction.member?.user?.id ?? '')?.voice.channel;

            if (!channel) {
              console.log('channel is undefined');
              await interaction.reply({
                content: localizedString('global:genericError'),
                ephemeral: true,
              });
            } else {
              await queue.connect(channel);
            }
          }
        } catch {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          global.player.deleteQueue(interaction.guildId!);
          await interaction.followUp({
            content: localizedString('global:unableToJoinVoiceChannel'),
            ephemeral: true,
          });
          return;
        }

        await interaction.followUp(localizedString('global:loadingYourSearch'));

        if (queue.destroyed) {
          const channel = interaction.guild?.members.cache.get(interaction.member?.user?.id ?? '')?.voice.channel;
          if (!channel) {
            console.log('channel is undefined');
            await interaction.reply({
              content: localizedString('global:genericError'),
              ephemeral: true,
            });
          } else {
            await queue.connect(channel);
          }
        }
        queue.addTrack(res.tracks[Number(content) - 1]);

        if (!queue.playing) await queue.play();
      }
    };

    interaction.client.on(Events.InteractionCreate, async (inter) => {
      if (!inter.isButton()) return;
      await playSong(inter.customId);
    });

    if (!collector) {
      console.log('Collector is undefined');
      await interaction.reply({
        content: localizedString('global:genericError'),
        ephemeral: true,
      });
    } else {
      collector.on('collect', async (query, collection) => {
        const content = collection.first()?.content;
        if (!interaction.guildId) {
          console.log('GuildId is undefined');
          await interaction.reply({
            content: localizedString('global:genericError'),
            ephemeral: true,
          });
        } else if (typeof query !== 'string' && content?.toLowerCase() === 'cancel') {
          await interaction.followUp({
            content: localizedString('global:searchCancelled'),
            ephemeral: true,
          });
          collector.stop();
        } else {
          await playSong(content ?? '');
        }
      });

      collector.on('end', async (_, msg: string) => {
        if (msg === 'time') {
          await interaction.followUp({
            content: localizedString('global:searchTimedOut', {
              user: interaction.member?.user.username,
            }),
            ephemeral: true,
          });
        }
      });
    }
  },
};
export default Play;
