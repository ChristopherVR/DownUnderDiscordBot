import { ApplicationCommandOptionType, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { PlayerCommand } from '../../models/discord.js';

import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { useDefaultPlayer } from '../../helpers/discord/player.js';
import { logger } from '../../helpers/logger/logger.js';
import { DefaultLoggerMessage } from '../../enums/logger.js';
import { Track } from 'discord-player';

export const Remove: PlayerCommand = {
  name: localizedString('global:remove'),
  description: localizedString('global:removeSongFromQueue'),
  nameLocalizations: getLocalizations('global:remove'),
  descriptionLocalizations: getLocalizations('global:removeSongFromQueue'),

  options: [
    {
      name: localizedString('global:song'),
      description: localizedString('global:nameUrlToRemoveFromQueue'),
      nameLocalizations: getLocalizations('global:song'),
      descriptionLocalizations: getLocalizations('global:nameUrlToRemoveFromQueue'),
      type: ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: localizedString('global:number'),
      description: localizedString('global:placeSongIsInQueue'),
      nameLocalizations: getLocalizations('global:number'),
      descriptionLocalizations: getLocalizations('global:placeSongIsInQueue'),
      type: ApplicationCommandOptionType.Number,
      required: false,
    },
  ],
  run: async (interaction: ChatInputCommandInteraction) => {
    const { localize } = useLocalizedString(interaction.locale);

    try {
      if (!interaction.guildId || !interaction.guild) {
        logger(DefaultLoggerMessage.GuildIsNotDefined).error();
        return await interaction.reply({
          content: localize('global:genericError'),
          ephemeral: true,
        });
      }

      const player = useDefaultPlayer();
      const queue = player.nodes.get(interaction.guildId);

      if (!queue?.isPlaying()) {
        return await interaction.reply({
          content: localize('global:noMusicCurrentlyPlaying'),
          ephemeral: true,
        });
      }

      const memberChannel = (interaction.member as GuildMember | null)?.voice.channel;
      if (!memberChannel || memberChannel.id !== queue.channel?.id) {
        return await interaction.reply({
          content: localize('global:mustBeInSameVoiceChannel'),
          ephemeral: true,
        });
      }

      const number = interaction.options.getNumber('number');
      const trackName = interaction.options.getString('song');

      if (!trackName && !number) {
        return await interaction.reply({
          content: localize('global:useValidOptionToRemoveSong'),
          ephemeral: true,
        });
      }

      let removedTrack: Track | null = null;

      if (number) {
        removedTrack = queue.tracks.data[number - 1];
        if (removedTrack) {
          queue.removeTrack(number - 1);
        }
      } else if (trackName) {
        removedTrack =
          queue.tracks.find((t) => t.title.toLowerCase() === trackName.toLowerCase() || t.url === trackName) ?? null;
        if (removedTrack) {
          queue.removeTrack(removedTrack);
        }
      }

      if (removedTrack) {
        return await interaction.reply({
          content: localize('global:removedSongFromQueue', { track: removedTrack.title }),
        });
      } else {
        return await interaction.reply({
          content: localize('global:couldNotFindTrack', { track: trackName ?? number }),
          ephemeral: true,
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        logger(error).error();
      } else {
        logger(String(error)).error();
      }
      if (interaction.replied || interaction.deferred) {
        return await interaction.followUp({
          content: localize('global:genericError'),
          ephemeral: true,
        });
      }
      return await interaction.reply({
        content: localize('global:genericError'),
        ephemeral: true,
      });
    }
  },
};

export default Remove;
