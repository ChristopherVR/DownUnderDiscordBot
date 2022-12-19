import {
  ApplicationCommandOptionType,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  PermissionsBitField,
  ApplicationCommandType,
  ButtonStyle,
  ChatInputCommandInteraction,
  Client,
  MessageActionRowComponentBuilder,
} from 'discord.js';
import { PlayerCommand } from '../../types';

export const Controller: PlayerCommand = {
  name: 'controller',
  description: 'set controller channel ',
  voiceChannel: false,
  permissions: PermissionsBitField.Flags.ManageMessages,
  options: [
    {
      name: 'channel',
      description: 'the channel you want to send it to',
      type: ApplicationCommandOptionType.Channel,
      required: true,
    },
  ],
  type: ApplicationCommandType.ChatInput,
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    if (!interaction.guild) {
      console.log('GuildId is undefined');
      return await interaction.reply({
        content: `Unable to handle your request. Please try again later.`,
        ephemeral: true,
      });
    }
    const { channel } = interaction;
    // const channel = interaction.options.getChannel('channel');
    if (!channel) {
      console.log('channel is undefined');
      return await interaction.reply({
        content: `Unable to handle your request. Please try again later.`,
        ephemeral: true,
      });
    }
    if (channel.type !== 0)
      return await interaction.reply({
        content: `you have to send it to a text channel.. ❌`,
        ephemeral: true,
      });

    if (!interaction.member) {
      console.log('member is undefined');
      return await interaction.reply({
        content: `Unable to handle your request. Please try again later.`,
        ephemeral: true,
      });
    }

    const back = new ButtonBuilder()
      .setLabel('Back')
      .setCustomId(JSON.stringify({ ffb: 'back' }))
      .setStyle(ButtonStyle.Primary);

    const skip = new ButtonBuilder()
      .setLabel('Skip')
      .setCustomId(JSON.stringify({ ffb: 'skip' }))
      .setStyle(ButtonStyle.Primary);

    const resumepause = new ButtonBuilder()
      .setLabel('Resume & Pause')
      .setCustomId(JSON.stringify({ ffb: 'resume&pause' }))
      .setStyle(ButtonStyle.Danger);

    const save = new ButtonBuilder()
      .setLabel('Save')
      .setCustomId(JSON.stringify({ ffb: 'savetrack' }))
      .setStyle(ButtonStyle.Success);

    const volumeup = new ButtonBuilder()
      .setLabel('Volume up')
      .setCustomId(JSON.stringify({ ffb: 'volumeup' }))
      .setStyle(ButtonStyle.Primary);

    const volumedown = new ButtonBuilder()
      .setLabel('Volume Down')
      .setCustomId(JSON.stringify({ ffb: 'volumedown' }))
      .setStyle(ButtonStyle.Primary);

    const loop = new ButtonBuilder()
      .setLabel('Loop')
      .setCustomId(JSON.stringify({ ffb: 'loop' }))
      .setStyle(ButtonStyle.Danger);

    const np = new ButtonBuilder()
      .setLabel('Now Playing')
      .setCustomId(JSON.stringify({ ffb: 'nowplaying' }))
      .setStyle(ButtonStyle.Secondary);

    const queuebutton = new ButtonBuilder()
      .setLabel('Queue')
      .setCustomId(JSON.stringify({ ffb: 'queue' }))
      .setStyle(ButtonStyle.Secondary);

    const embed = new EmbedBuilder()
      .setTitle('control your music from the buttons below')
      .setImage(interaction.guild.iconURL({ size: 4096 }))
      .setColor('#36393e')
      .setFooter({
        text: 'Music comes first - Made with heart by ChristopherVR ❤️',
        iconURL: interaction.member.avatar ?? undefined,
      });

    await interaction.reply({
      content: `sending controller to ${channel.name}... ✅`,
      ephemeral: true,
    });

    const row1 = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      back,
      queuebutton,
      resumepause,
      np,
      skip,
    );
    const row2 = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      volumedown,
      loop,
      save,
      volumeup,
    );
    return await channel.send({ embeds: [embed], components: [row1, row2] });
  },
};

export default Controller;