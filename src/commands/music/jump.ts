import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChatInputCommandInteraction,
  GuildMember,
  MessageFlags,
} from 'discord.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { PlayerCommand } from '../../models/discord.js';

import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { useDefaultPlayer } from '../../helpers/discord/player.js';
import { logger } from '../../helpers/logger/logger.js';
import { Track } from 'discord-player';

export const Jump: PlayerCommand = {
  name: localizedString('global:jump'),
  description: localizedString('global:jumpDesc'),
  nameLocalizations: getLocalizations('global:jump'),
  descriptionLocalizations: getLocalizations('global:jumpDesc'),
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
  type: ApplicationCommandType.ChatInput,
  run: async (interaction: ChatInputCommandInteraction) => {
    const { localize } = useLocalizedString(interaction.locale);

    try {
      if (!interaction.guildId || !interaction.guild) {
        logger.error('Guild is not defined.');
        return await interaction.reply({ content: localize('global:genericError'), flags: MessageFlags.Ephemeral });
      }

      const player = useDefaultPlayer();
      const queue = player.nodes.get(interaction.guildId);

      if (!queue?.isPlaying()) {
        return await interaction.reply({
          content: localize('global:noMusicCurrentlyPlaying'),
          flags: MessageFlags.Ephemeral,
        });
      }

      const memberChannel = (interaction.member as GuildMember | null)?.voice.channel;
      if (!memberChannel || memberChannel.id !== queue.channel?.id) {
        return await interaction.reply({
          content: localize('global:mustBeInSameVoiceChannel'),
          flags: MessageFlags.Ephemeral,
        });
      }

      const trackName = interaction.options.getString('song');
      const number = interaction.options.getNumber('number');

      if (!trackName && !number) {
        return await interaction.reply({
          content: localize('global:haveToUseOneOfTheOptions'),
          flags: MessageFlags.Ephemeral,
        });
      }

      let targetTrack: Track | null = null;

      if (number) {
        targetTrack = queue.tracks.data[number - 1];
      } else if (trackName) {
        targetTrack =
          queue.tracks.find((t) => t.title.toLowerCase() === trackName.toLowerCase() || t.url === trackName) ?? null;
      }

      if (targetTrack) {
        queue.node.jump(targetTrack);
        return await interaction.reply({
          content: localize('global:jumpedTo', { track: targetTrack.title }),
          flags: MessageFlags.Ephemeral,
        });
      } else {
        return await interaction.reply({
          content: localize('global:couldNotFindTrack', { track: trackName ?? number }),
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (error) {
      logger.error(error);
      if (interaction.replied || interaction.deferred) {
        return await interaction.followUp({
          content: localize('global:genericError'),
          flags: MessageFlags.Ephemeral,
        });
      }
      return await interaction.reply({ content: localize('global:genericError'), flags: MessageFlags.Ephemeral });
    }
  },
};

export default Jump;
