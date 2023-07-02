import { ApplicationCommandType, ChatInputCommandInteraction } from 'discord.js';
import { localizedString } from '../../helpers/localization';
import { PlayerCommand } from '../../types';

import getLocalizations from '../../helpers/multiMapLocalization';
import { useDefaultPlayer } from '../../helpers/discord';

export const Clear: PlayerCommand = {
  name: localizedString('global:clear'),
  description: localizedString('global:clearAllInQueue'),
  nameLocalizations: getLocalizations('global:clear'),
  descriptionLocalizations: getLocalizations('global:clearAllInQueue'),
  voiceChannel: true,
  type: ApplicationCommandType.ChatInput,
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
      const loc = localizedString('global:noMusicCurrentlyPlaying', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: loc,
        ephemeral: true,
      });
    }

    if (!queue.tracks[0]) {
      const loc = localizedString('global:noTrackInQueue', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: loc,
        ephemeral: true,
      });
    }

    queue.tracks.clear();

    const loc = localizedString('global:queueHasBeenCleared', {
      lng: interaction.locale,
    });
    return await interaction.reply(loc);
  },
};

export default Clear;
