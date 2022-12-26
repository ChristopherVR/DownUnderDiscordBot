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
import { getPlayer } from '../helpers/player';
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
        content: `Unable to handle your request. Please try again later.`,
        ephemeral: true,
      });
    }
    const song = interaction.options.getString('song') ?? '';

    const res = await getPlayer().search(song, {
      requestedBy: interaction.member as unknown as User,
      searchEngine: QueryType.AUTO,
    });

    if (!res?.tracks?.length)
      return await interaction.reply({
        content: `No results found ${interaction.member?.user.id ?? ''}... try again ? ❌`,
        ephemeral: true,
      });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const queue = getPlayer().createQueue(interaction.guild!, {
      metadata: interaction.channel,
      leaveOnEnd: false,
    });
    const maxTracks = res.tracks.slice(0, 5);

    const embed = new EmbedBuilder()
      .setColor('#ff0000')
      .setAuthor({
        name: `Results for ${song}`,
        iconURL: interaction.client.user?.displayAvatarURL({ size: 1024 }),
      })
      .setDescription(
        `${maxTracks
          .map((track, i) => `**${i + 1}**. ${track.title} | ${track.author}`)
          .join('\n')}\n\nSelect choice between **1** and **${maxTracks.length}** or **cancel** ⬇️`,
      )
      .setTimestamp()
      .setFooter({
        text: 'Music comes first - Made with heart by ChristopherVR ❤️',
        iconURL: interaction.member?.avatar ?? undefined,
      });

    const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      ...[...Array(5).keys()].map((y) =>
        new ButtonBuilder().setLabel(y.toString()).setCustomId(y.toString()).setStyle(ButtonStyle.Primary),
      ),
      new ButtonBuilder().setLabel('Cancel').setCustomId('cancel').setStyle(ButtonStyle.Secondary),
    );
    await interaction.reply({ embeds: [embed], components: [row] });

    const collector = interaction.channel?.createMessageCollector({
      time: 15000,
      max: 1,
      //   errors: ['time'],
      filter: (m) => m.author.id === interaction.member?.user.id,
    });

    const playSong = async (content: string) => {
      const value = parseInt(content ?? '', 10);
      if (!value || value <= 0 || value > maxTracks.length) {
        await interaction.followUp({
          content: `Invalid response, try a value between **1** and **${maxTracks.length}** or **cancel**... try again ? ❌`,
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
                content: `Unable to handle your request. Please try again later.`,
                ephemeral: true,
              });
            } else {
              await queue.connect(channel);
            }
          }
        } catch {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          getPlayer().deleteQueue(interaction.guildId!);
          await interaction.followUp({
            content: `I can't join the voice channel ${interaction.member?.user.id ?? ''}... try again ? ❌`,
            ephemeral: true,
          });
          return;
        }

        await interaction.followUp(`Loading your search... 🎧`);

        if (queue.destroyed) {
          const channel = interaction.guild?.members.cache.get(interaction.member?.user?.id ?? '')?.voice.channel;
          if (!channel) {
            console.log('channel is undefined');
            await interaction.reply({
              content: `Unable to handle your request. Please try again later.`,
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
      await interaction.reply({
        content: `Unable to handle your request. Please try again later.`,
        ephemeral: true,
      });
    } else {
      collector.on('collect', async (query, collection) => {
        console.log(query, collection);
        const content = collection.first()?.content;
        if (!interaction.guildId) {
          console.log('GuildId is undefined');
          await interaction.reply({
            content: `Unable to handle your request. Please try again later.`,
            ephemeral: true,
          });
        } else if (typeof query !== 'string' && content?.toLowerCase() === 'cancel') {
          await interaction.followUp({
            content: `Search cancelled ✅`,
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
            content: `Search timed out ${interaction.member?.user.id ?? ''}... try again ? ❌`,
            ephemeral: true,
          });
        }
      });
    }
  },
};
export default Play;
