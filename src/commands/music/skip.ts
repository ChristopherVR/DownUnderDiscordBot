import { ChatInputCommandInteraction } from 'discord.js';
import i18next from 'i18next';
import { PlayerCommand } from '../../types';
import { getPlayer } from '../helpers/player';
import getLocalizations from '../i18n/discordLocalization';

export const Skip: PlayerCommand = {
  name: i18next.t('global:skip'),
  description: i18next.t('global:stopTrack'),
  nameLocalizations: getLocalizations('global:skip'),
  descriptionLocalizations: getLocalizations('global:stopTrack'),
  voiceChannel: true,

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
      const noMusicCurrentlyPlaying = i18next.t('global:noMusicCurrentlyPlaying', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: noMusicCurrentlyPlaying,
        ephemeral: true,
      });
    }

    const success = queue.skip();
    const currentTrackSkipped = i18next.t('global:genericError', {
      lng: interaction.locale,
      track: queue.current.title,
    });
    return await interaction.reply({
      content: success ? currentTrackSkipped : genericError,
    });
  },
};

export default Skip;
