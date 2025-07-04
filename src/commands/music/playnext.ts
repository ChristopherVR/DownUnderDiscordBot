import { QueryType } from 'discord-player';
import { ApplicationCommandOptionType, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { PlayerCommand } from '../../models/discord.js';

import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { useDefaultPlayer } from '../../helpers/discord/player.js';
import { logger } from '../../helpers/logger/logger.js';
import { DefaultLoggerMessage } from '../../enums/logger.js';
import { Track } from 'discord-player';

export const PlayNext: PlayerCommand = {
  name: localizedString('global:playnext'),
  description: localizedString('global:songToPlayNext'),
  nameLocalizations: getLocalizations('global:playnext'),
  descriptionLocalizations: getLocalizations('global:songToPlayNext'),

  options: [
    {
      name: localizedString('global:song'),
      description: localizedString('global:songToPlayNext'),
      nameLocalizations: getLocalizations('global:song'),
      descriptionLocalizations: getLocalizations('global:songToPlayNext'),
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  run: async (interaction: ChatInputCommandInteraction) => {
    const { localize } = useLocalizedString(interaction.locale);

    try {
      if (!interaction.guildId || !interaction.guild) {
        logger(DefaultLoggerMessage.GuildIsNotDefined).error();
        return await interaction.reply({ content: localize('global:genericError'), ephemeral: true });
      }

      const player = useDefaultPlayer();
      const queue = player.nodes.get(interaction.guildId);

      if (!queue?.isPlaying()) {
        return await interaction.reply({ content: localize('global:noMusicCurrentlyPlaying'), ephemeral: true });
      }

      const memberChannel = (interaction.member as GuildMember | null)?.voice.channel;
      if (!memberChannel || memberChannel.id !== queue.channel?.id) {
        return await interaction.reply({ content: localize('global:mustBeInSameVoiceChannel'), ephemeral: true });
      }

      const song = interaction.options.getString('song', true);
      await interaction.deferReply({ ephemeral: true });

      const res = await player.search(song, {
        requestedBy: interaction.member as GuildMember,
        searchEngine: QueryType.AUTO,
      });

      if (!res.tracks.length) {
        return await interaction.followUp({ content: localize('global:noResultsFound') });
      }

      if (res.playlist) {
        return await interaction.followUp({ content: localize('global:playlistsNotSupported') });
      }

      queue.insertTrack(res.tracks[0] as Track, 0);

      return await interaction.followUp({
        content: localize('global:trackInsertedIntoQueue', { track: res.tracks[0].title }),
      });
    } catch (error) {
      if (error instanceof Error) {
        logger(error).error();
      } else {
        logger(String(error)).error();
      }
      if (interaction.replied || interaction.deferred) {
        return await interaction.followUp({ content: localize('global:genericError'), ephemeral: true });
      }
      return await interaction.reply({ content: localize('global:genericError'), ephemeral: true });
    }
  },
};

export default PlayNext;
