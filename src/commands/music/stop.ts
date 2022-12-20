import { ChatInputCommandInteraction } from 'discord.js';
import i18next from 'i18next';
import { PlayerCommand } from '../../types';
import { getPlayer } from '../helpers/player';
import getLocalizations from '../i18n/discordLocalization';

export const Stop: PlayerCommand = {
  name: i18next.t('global:stop'),
  description: i18next.t('global:stopTrack'),
  nameLocalizations: getLocalizations('global:stop'),
  descriptionLocalizations: getLocalizations('global:stopTrack'),
  voiceChannel: true,

  run: async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      const genericError = i18next.t('global:genericError', {
        lng: interaction.locale,
      });
      console.log('GuildId is undefined');
      return await interaction.reply({
        content: genericError,
        ephemeral: true,
      });
    }
    const queue = getPlayer().getQueue(interaction.guildId);

    if (!queue?.playing) {
      const noMusicCurrentlyPlaying = i18next.t('global:noMusicCurrentlyPlaying', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: noMusicCurrentlyPlaying,
        ephemeral: true,
      });
    }

    queue.clear();
    queue.destroy();
    const loc = i18next.t('global:musicStopped', {
      lng: interaction.locale,
    });
    return await interaction.reply({
      content: loc,
    });
  },
};

export default Stop;
