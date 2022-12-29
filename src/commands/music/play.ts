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
    const song =
      interaction.options.getString(
        localizedString('global:linkOrQuery', {
          lng: interaction.locale,
        }),
      ) ?? '';

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

    const collector = interaction.channel?.createMessageCollector({
      time: 15000,
      max: 1,
      filter: (m) => m.author.id === interaction.member?.user.id,
    });

    const playSong = async (content: string) => {
      if (content === 'cancel') {
        // await interaction.reply({
        //   content: localizedString('global:searchCancelled', { lng: interaction.locale }),
        //   ephemeral: true,
        // });
        collector?.stop();
        if (queue.connection) {
          queue.destroy(true);
        }
        await interaction.deleteReply();
      } else {
        const value = parseInt(content, 10);
        console.log('Song track to play - ', value);
        if (!(value >= 0 || value < maxTracks.length || content !== 'cancel')) {
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
                console.log('channel is undefined');
                await interaction.reply({
                  content: localizedString('global:connectToVoiceChannelToUseBot', { lng: interaction.locale }),
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
              content: localizedString('global:unableToJoinVoiceChannel', { lng: interaction.locale }),
              ephemeral: true,
            });
            return;
          }

          await interaction.followUp(localizedString('global:loadingYourSearch', { lng: interaction.locale }));

          if (queue.destroyed) {
            const channel = interaction.guild?.members.cache.get(interaction.member?.user?.id ?? '')?.voice.channel;
            if (!channel) {
              console.log('channel is undefined');
              await interaction.reply({
                content: localizedString('global:genericError', { lng: interaction.locale }),
                ephemeral: true,
              });
            } else {
              await queue.connect(channel);
            }
          }
          queue.addTrack(res.tracks[Number(content) - 1]);

          if (!queue.playing) await queue.play();
        }
      }
    };

    interaction.client.on(Events.InteractionCreate, async (inter) => {
      if (!inter.isButton()) return;
      await playSong(inter.customId);
    });

    if (!collector) {
      console.log('Collector is undefined');
      await interaction.reply({
        content: localizedString('global:genericError', { lng: interaction.locale }),
        ephemeral: true,
      });
    } else {
      collector.on('end', async (_, msg: string) => {
        if (msg === 'time') {
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
