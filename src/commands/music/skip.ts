import { ChatInputCommandInteraction } from 'discord.js';
import { localizedString } from '../../i18n';
import { PlayerCommand } from '../../types';

import getLocalizations from '../i18n/discordLocalization';

export const Skip: PlayerCommand = {
  name: localizedString('global:skip'),
  description: localizedString('global:stopTrack'),
  nameLocalizations: getLocalizations('global:skip'),
  descriptionLocalizations: getLocalizations('global:stopTrack'),
  voiceChannel: true,

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
      const noMusicCurrentlyPlaying = localizedString('global:noMusicCurrentlyPlaying', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: noMusicCurrentlyPlaying,
        ephemeral: true,
      });
    }

    const success = queue.skip();
    const currentTrackSkipped = localizedString('global:genericError', {
      lng: interaction.locale,
      track: queue.current.title,
    });
    return await interaction.reply({
      content: success ? currentTrackSkipped : genericError,
    });
  },
};

export default Skip;
