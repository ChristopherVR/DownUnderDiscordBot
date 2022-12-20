import { ApplicationCommandType, ChatInputCommandInteraction } from 'discord.js';
import i18next from 'i18next';
import { PlayerCommand } from '../../types';
import { getPlayer } from '../helpers/player';
import getLocalizations from '../i18n/discordLocalization';

export const Back: PlayerCommand = {
  name: i18next.t('global:back'),
  description: i18next.t('global:backToPreviousSong'),
  nameLocalizations: getLocalizations('global:back'),
  descriptionLocalizations: getLocalizations('global:backToPreviousSong'),
  voiceChannel: true,
  type: ApplicationCommandType.ChatInput,
  run: async (interaction: ChatInputCommandInteraction) => {
    const genericError = i18next.t('global:genericError', {
      lng: interaction.locale,
    });
    if (!interaction.guildId) {
      console.log('GuildId is undefined');

      return await interaction.reply({
        content: genericError,
        ephemeral: true,
      });
    }
    const queue = getPlayer().getQueue(interaction.guildId);

    if (!queue?.playing) {
      const loc = i18next.t('global:noMusicCurrentlyPlaying', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: loc,
        ephemeral: true,
      });
    }

    if (!queue.previousTracks[1]) {
      const loc = i18next.t('global:noMusicPlayedPreviously', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: loc,
        ephemeral: true,
      });
    }

    await queue.back();
    const loc = i18next.t('global:playingPreviousTrack', {
      lng: interaction.locale,
    });
    return await interaction.reply({ content: loc });
  },
};

export default Back;
