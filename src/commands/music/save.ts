import { ChatInputCommandInteraction, EmbedBuilder, GuildMember } from 'discord.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { PlayerCommand } from '../../models/discord.js';

import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { logger } from '../../helpers/logger/logger.js';
import { DefaultLoggerMessage } from '../../enums/logger.js';
import { useDefaultPlayer } from '../../helpers/discord/player.js';

export const Save: PlayerCommand = {
  name: localizedString('global:save'),
  description: localizedString('global:saveThisTrack'),
  nameLocalizations: getLocalizations('global:save'),
  descriptionLocalizations: getLocalizations('global:saveThisTrack'),
  run: async (interaction: ChatInputCommandInteraction) => {
    const { localize } = useLocalizedString(interaction.locale);

    try {
      if (!interaction.guildId || !interaction.guild) {
        logger(DefaultLoggerMessage.GuildIsNotDefined).error();
        return await interaction.reply({ content: localize('global:genericError'), ephemeral: true });
      }

      const player = useDefaultPlayer();
      const queue = player.nodes.get(interaction.guildId);

      if (!queue?.isPlaying() || !queue.currentTrack) {
        return await interaction.reply({ content: localize('global:noMusicCurrentlyPlaying'), ephemeral: true });
      }
      const memberChannel = (interaction.member as GuildMember | null)?.voice.channel;
      if (!memberChannel || memberChannel.id !== queue.channel?.id) {
        return await interaction.reply({ content: localize('global:mustBeInSameVoiceChannel'), ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle(`:arrow_forward: ${queue.currentTrack.title}`)
        .setURL(queue.currentTrack.url)
        .addFields(
          {
            name: `:hourglass: ${localize('global:duration')}`,
            value: `\`${queue.currentTrack.duration}\``,
            inline: true,
          },
          {
            name: localize('global:songBy'),
            value: `\`${queue.currentTrack.author}\``,
            inline: true,
          },
          {
            name: `${localize('global:views')} :eyes:`,
            value: `\`${Number(queue.currentTrack.views).toLocaleString()}\``,
            inline: true,
          },
          {
            name: localize('global:songUrl'),
            value: `\`${queue.currentTrack.url}\``,
          },
        )
        .setThumbnail(queue.currentTrack.thumbnail)
        .setFooter({
          text: `${localize('global:fromTheServer')} ${interaction.guild?.name ?? ''}`,
          iconURL: interaction.guild?.iconURL() ?? undefined,
        });

      await interaction.user.send({ embeds: [embed] });
      await interaction.reply({ content: localize('global:titleOfMusicPmSend'), ephemeral: true });
    } catch (error) {
      if (error instanceof Error) {
        logger(error).error();
      } else {
        logger(String(error)).error();
      }
      if (interaction.replied || interaction.deferred) {
        return await interaction.followUp({
          content: localize('global:unableToSendPrivateMessag'),
          ephemeral: true,
        });
      }
      await interaction.reply({
        content: localize('global:unableToSendPrivateMessag'),
        ephemeral: true,
      });
    }
  },
};

export default Save;
