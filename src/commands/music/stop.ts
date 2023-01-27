import { ChatInputCommandInteraction } from 'discord.js';
import { localizedString } from '../../i18n';
import { PlayerCommand } from '../../types';

import getLocalizations from '../i18n/discordLocalization';

export const Stop: PlayerCommand = {
  name: localizedString('global:stop'),
  description: localizedString('global:stopTrack'),
  nameLocalizations: getLocalizations('global:stop'),
  descriptionLocalizations: getLocalizations('global:stopTrack'),
  voiceChannel: true,

  run: async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      const genericError = localizedString('global:genericError', {
        lng: interaction.locale,
      });
      console.log('GuildId is undefined');
      return await interaction.reply({
        content: genericError,
        ephemeral: true,
      });
    }
    const queue = global.player.getQueue(interaction.guildId);

    if (!queue?.playing) {
      const noMusicCurrentlyPlaying = localizedString('global:noMusicCurrentlyPlaying', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: noMusicCurrentlyPlaying,
        ephemeral: true,
      });
    }

    queue.clear();
    queue.destroy();
    const loc = localizedString('global:musicStopped', {
      lng: interaction.locale,
    });
    return await interaction.reply({
      content: loc,
    });
  },
};

export default Stop;
