import { ApplicationCommandType, ChatInputCommandInteraction } from 'discord.js';
import { localizedString } from '../../i18n';
import { PlayerCommand } from '../../types';

import getLocalizations from '../i18n/discordLocalization';

export const Back: PlayerCommand = {
  name: localizedString('global:back'),
  description: localizedString('global:backToPreviousSong'),
  nameLocalizations: getLocalizations('global:back'),
  descriptionLocalizations: getLocalizations('global:backToPreviousSong'),
  voiceChannel: true,
  type: ApplicationCommandType.ChatInput,
  run: async (interaction: ChatInputCommandInteraction) => {
    const genericError = localizedString('global:genericError', {
      lng: interaction.locale,
    });
    if (!interaction.guildId) {
      console.log('GuildId is undefined');

      return await interaction.reply({
        content: genericError,
        ephemeral: true,
      });
    }
    const queue = global.player.getQueue(interaction.guildId);

    if (!queue?.playing) {
      const loc = localizedString('global:noMusicCurrentlyPlaying', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: loc,
        ephemeral: true,
      });
    }

    if (!queue.previousTracks[1]) {
      const loc = localizedString('global:noMusicPlayedPreviously', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: loc,
        ephemeral: true,
      });
    }

    await queue.back();
    const loc = localizedString('global:playingPreviousTrack', {
      lng: interaction.locale,
    });
    return await interaction.reply({ content: loc });
  },
};

export default Back;
