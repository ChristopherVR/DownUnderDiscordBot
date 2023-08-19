import { ChatInputCommandInteraction, EmbedBuilder, InteractionReplyOptions, MessagePayload } from 'discord.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { PlayerCommand } from '../../models/discord.js';

import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { logger } from '../../helpers/logger/logger.js';
import { DefaultLoggerMessage } from '../../constants/logger.js';
import { useDefaultPlayer } from '../../helpers/discord/player.js';

export const Save: PlayerCommand = {
  name: localizedString('global:save'),
  description: localizedString('global:saveThisTrack'),
  nameLocalizations: getLocalizations('global:save'),
  descriptionLocalizations: getLocalizations('global:saveThisTrack'),
  run: async (interaction: ChatInputCommandInteraction) => {
    const { localize } = useLocalizedString(interaction.locale);
    const genericError = localize('global:genericError');
    const sendResponse = async (options: string | MessagePayload | InteractionReplyOptions) => {
      if (interaction.replied) {
        await interaction.followUp(options);
      } else {
        await interaction.reply(options);
      }
    };

    if (!interaction.guildId) {
      logger(DefaultLoggerMessage.GuildIsNotDefined).error();
      return await sendResponse({
        content: genericError,
        ephemeral: true,
      });
    }
    const player = await useDefaultPlayer();
    const queue = player.nodes.get(interaction.guildId);

    if (!queue) {
      const noMusicCurrentlyPlaying = localize('global:noMusicCurrentlyPlaying', {
        lng: interaction.locale,
      });
      return await sendResponse({
        content: noMusicCurrentlyPlaying,
        ephemeral: true,
      });
    }

    if (!queue.currentTrack) {
      return await sendResponse({
        content: genericError,
        ephemeral: true,
      });
    }

    try {
      await interaction.user.send({
        embeds: [
          new EmbedBuilder()
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
                name: localizedString('global:songBy'),
                value: `\`${queue.currentTrack.author}\``,
                inline: true,
              },
              {
                name: `${localize('global:views')} :eyes:`,
                value: `\`${Number(queue.currentTrack.views).toLocaleString()}\``,
                inline: true,
              },
              {
                name: localizedString('global:songUrl'),
                value: `\`${queue.currentTrack.url}\``,
              },
            )
            .setThumbnail(queue.currentTrack.thumbnail)
            .setFooter({
              text: `${localize('global:fromTheServer')} ${interaction.guild?.name ?? ''}`,
              iconURL: interaction.guild?.iconURL() ?? undefined,
            }),
        ],
      });

      const titleOfMusicPmSend = localize('global:titleOfMusicPmSend', {
        lng: interaction.locale,
      });
      return await sendResponse({
        content: titleOfMusicPmSend,
        ephemeral: true,
      });
    } catch {
      const unableToSendPrivateMessag = localize('global:unableToSendPrivateMessag', {
        lng: interaction.locale,
      });
      return await sendResponse({
        content: unableToSendPrivateMessag,
        ephemeral: true,
      });
    }
  },
};

export default Save;
