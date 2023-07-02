import { ChatInputCommandInteraction } from 'discord.js';
import { localizedString } from '../../helpers/localization';
import { PlayerCommand } from '../../types';

import getLocalizations from '../../helpers/multiMapLocalization';
import { useDefaultPlayer } from '../../helpers/discord';

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
    const player = await useDefaultPlayer();
    const queue = player.nodes.get(interaction.guildId);

    if (!queue?.isPlaying()) {
      const noMusicCurrentlyPlaying = localizedString('global:noMusicCurrentlyPlaying', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: noMusicCurrentlyPlaying,
        ephemeral: true,
      });
    }

    queue.tracks.clear();
    queue.delete();
    const loc = localizedString('global:musicStopped', {
      lng: interaction.locale,
    });
    return await interaction.reply({
      content: loc,
    });
  },
};

export default Stop;
