import {
  ActionRowBuilder,
  ApplicationCommandType,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  Client,
  Colors,
  EmbedBuilder,
  Events,
  MessageActionRowComponentBuilder,
  MessageComponentInteraction,
} from 'discord.js';
import { PlayerCommand } from '../../types';
import { getPlayer } from '../helpers/player';

export const NowPlaying: PlayerCommand = {
  name: 'nowplaying',
  description: 'view what is playing!',
  voiceChannel: true,

  type: ApplicationCommandType.ChatInput,

  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      console.log('GuildId is undefined');
      return await interaction.reply({
        content: `Unable to handle your request. Please try again later.`,
        ephemeral: true,
      });
    }
    const queue = getPlayer().getQueue(interaction.guildId);

    if (!queue)
      return await interaction.reply({
        content: `No music currently playing ${interaction.member?.user.id ?? ''}... try again ? ❌`,
        ephemeral: true,
      });

    const track = queue.current;

    const methods = ['disabled', 'track', 'queue'];

    const timestamp = queue.getPlayerTimestamp();

    const trackDuration = timestamp.progress === Number.MAX_SAFE_INTEGER ? 'infinity (live)' : track.duration;

    const progress = queue.createProgressBar();

    const saveButton = new ButtonBuilder()
      .setLabel('Save this track')
      .setCustomId(JSON.stringify({ ffb: 'savetrack' }))
      .setStyle(ButtonStyle.Success);

    const volumeup = new ButtonBuilder()
      .setLabel('Volume up')
      .setCustomId(JSON.stringify({ ffb: 'volumeup' }))
      .setStyle(ButtonStyle.Secondary);

    const volumedown = new ButtonBuilder()
      .setLabel('Volume Down')
      .setCustomId(JSON.stringify({ ffb: 'volumedown' }))
      .setStyle(ButtonStyle.Secondary);

    const loop = new ButtonBuilder()
      .setLabel('Loop')
      .setCustomId(JSON.stringify({ ffb: 'loop' }))
      .setStyle(ButtonStyle.Secondary);

    const resumepause = new ButtonBuilder()
      .setLabel('Resume & Pause')
      .setCustomId(JSON.stringify({ ffb: 'resume&pause' }))
      .setStyle(ButtonStyle.Primary);

    const embed = new EmbedBuilder()
      .setAuthor({
        name: track.title,
        iconURL: client.user?.displayAvatarURL({ size: 1024 }),
      })
      .setThumbnail(track.thumbnail)
      .setDescription(
        `Volume **${queue.volume}**%\nDuration **${trackDuration}**\nProgress ${progress}\nLoop mode **${
          methods[queue.repeatMode]
        }**\nRequested by ${track.requestedBy.username}`,
      )
      .setFooter({
        text: 'Music comes first - Made with heart by ChristopherVR ❤️',
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

    client.on(Events.InteractionCreate, (inter) => {
      if (!inter.isButton()) return;
      console.log(inter);
    });

    return await interaction.reply({ embeds: [embed], components: [row] });
  },
};

export default NowPlaying;
