import { QueryType } from 'discord-player';
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
  User,
} from 'discord.js';
import { localizedString } from '../../i18n';
import { PlayerCommand } from '../../types';
import cast from '../../helpers/cast';

import getLocalizations from '../../i18n/discordLocalization';

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
    // if (!interaction.deferred) {
    //   await interaction.deferReply({ ephemeral: true });
    // }
    if (!interaction.guildId) {
      console.log('GuildId is undefined');
      return await interaction.reply({
        content: localizedString('global:genericError', {
          lng: interaction.locale,
        }),
        ephemeral: true,
      });
    }
    const song = interaction.options.getString(
      localizedString('global:linkOrQuery', {
        lng: interaction.locale,
      }),
    );

    if (!song) {
      return await interaction.reply({
        content: localizedString('global:genericError', {
          lng: interaction.locale,
          user: interaction.member?.user.username,
        }),
        ephemeral: true,
      });
    }

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

    if (!interaction.guild) {
      console.log('Guild not available on interaction.');
      return await interaction.reply({
        content: localizedString('global:genericError', {
          lng: interaction.locale,
          user: interaction.member?.user.username,
        }),
        ephemeral: true,
      });
    }

    const queue =
      global.player.getQueue(interaction.guild) ??
      global.player.createQueue(interaction.guild, {
        metadata: interaction.channel,
        leaveOnEnd: false,
        ytdlOptions: {
          filter: 'audioonly',
          // eslint-disable-next-line no-bitwise
          highWaterMark: 1 << 30,
          dlChunkSize: 0,
        },
      });
    const maxTracks = res.tracks.slice(0, 5);

    const embed = new EmbedBuilder()
      .setColor('#ff0000')
      .setAuthor({
        name: localizedString('global:resultsFor', { track: song, lng: interaction.locale }),
        iconURL: interaction.client.user?.displayAvatarURL({ size: 1024 }),
      })
      .setDescription(
        `${maxTracks
          .map((track, i) => `**${i + 1}**. ${track.title} | ${track.author}`)
          .join('\n')}\n\n${localizedString('global:selectAChoiceBetween', {
          lng: interaction.locale,
          count: maxTracks.length - 1,
        })}`,
      )
      .setTimestamp()
      .setFooter({
        text: localizedString('global:defaultFooter', { lng: interaction.locale }),
        iconURL: interaction.member?.avatar ?? undefined,
      });

    const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      ...[...Array(4).keys()].map((y) => {
        const label = (1 + y).toString();
        return new ButtonBuilder().setLabel(label).setCustomId(label).setStyle(ButtonStyle.Primary);
      }),
      new ButtonBuilder()
        .setLabel(localizedString('global:cancel', { lng: interaction.locale }))
        .setCustomId('cancel')
        .setStyle(ButtonStyle.Secondary),
    );
    await interaction.reply({ embeds: [embed], components: [row] });

    if (interaction.channel?.type !== ChannelType.GuildText) {
      return await interaction.reply({
        content: localizedString('global:genericError', {
          lng: interaction.locale,
          user: interaction.member?.user.username,
        }),
        ephemeral: true,
      });
    }
    const collector = interaction.channel?.createMessageComponentCollector({
      time: 15000,
      max: 1,
      filter: (m) => {
        console.log('Author id', m.member.id);
        console.log('User Id', interaction.user.id);
        return m.member.id === interaction.user.id;
      },
    });

    if (!collector) {
      console.log('Collector is undefined');
      await interaction.reply({
        content: localizedString('global:genericError', { lng: interaction.locale }),
        ephemeral: true,
      });
    } else {
      const playSong = async (content: string) => {
        if (content === 'cancel') {
          await interaction.reply({
            content: localizedString('global:searchCancelled', { lng: interaction.locale }),
            ephemeral: true,
          });
          collector?.stop();
          if (queue.connection && !queue.destroyed) {
            queue.destroy(true);
          }
          console.log('Deleting reply');
          await interaction.deleteReply();
        } else {
          const value = parseInt(content, 10);
          console.log('Requested song index to play - ', value);
          if (!(value >= 0 || value < maxTracks.length || content !== 'cancel')) {
            await interaction.deleteReply();
            await interaction.followUp({
              content: localizedString('global:invalidResponseForSong', {
                max: maxTracks.length - 1,
                lng: interaction.locale,
              }),
              ephemeral: true,
            });
          } else {
            collector?.stop();

            try {
              if (!queue.connection) {
                const channel = interaction.guild?.members.cache.get(interaction.member?.user?.id ?? '')?.voice.channel;

                if (!channel) {
                  console.log(`User ${interaction.member?.user.username} is not connected to a voice channel.`);

                  await interaction.deleteReply();
                  await interaction.followUp({
                    content: localizedString('global:connectToVoiceChannelToUseBot', { lng: interaction.locale }),
                    ephemeral: true,
                  });

                  return;
                }
                await queue.connect(channel);
              }
            } catch (ex) {
              console.log('An error occurred. Exception thrown: ', ex);
              if (interaction.guildId) global.player.deleteQueue(interaction.guildId);
              await interaction.followUp({
                content: localizedString('global:unableToJoinVoiceChannel', { lng: interaction.locale }),
                ephemeral: true,
              });
              return;
            }

            if (queue.destroyed) {
              const channel = interaction.guild?.members.cache.get(interaction.member?.user?.id ?? '')?.voice.channel;
              if (!channel) {
                console.log(`User ${interaction.member?.user.username} is not connected to a voice channel.`);
                await interaction.reply({
                  content: localizedString('global:genericError', { lng: interaction.locale }),
                  ephemeral: true,
                });
                return;
              }
              await queue.connect(channel);
            }

            const track = res.tracks[Number(content) - 1];
            queue.addTrack(track);

            if (!queue.playing) {
              console.log('Starting track ', queue.tracks[0].description);
              await queue.play();
              const em = new EmbedBuilder()
                .setAuthor({ name: localizedString('global:songAddedToQueue', { lng: interaction.locale, song }) })
                .setDescription(`[${track.title}](${track.url})`)
                .setColor('Random');
              await interaction.deleteReply();
              await interaction.followUp({
                embeds: [em],
              });
              console.log('Played track ', queue.tracks[0]?.description);
            } else {
              await interaction.followUp(localizedString('global:songAddedToQueue', { lng: interaction.locale, song }));
              console.log('There is already a track playing. Adding new one to the queue.');
            }
          }
        }
      };
      collector.on('collect', (inter) => {
        if ('customId' in inter && typeof inter.customId === 'string') {
          playSong(inter.customId);
        } else {
          console.log('Custom id does not exist on interaction: ', inter);
        }
      });

      collector.on('end', async (_, msg: string) => {
        if (msg === 'time') {
          await interaction.deleteReply();
          await interaction.followUp({
            content: localizedString('global:searchTimedOut', {
              user: interaction.member?.user.username,
              lng: interaction.locale,
            }),
            ephemeral: true,
          });
        }
      });
    }
  },
};
export default Play;
