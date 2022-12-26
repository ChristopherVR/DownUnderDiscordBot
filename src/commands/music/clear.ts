import { ApplicationCommandType, ChatInputCommandInteraction } from 'discord.js';
import { localizedString } from '../../i18n';
import { PlayerCommand } from '../../types';
import { getPlayer } from '../helpers/player';
import getLocalizations from '../i18n/discordLocalization';

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

    const queue = getPlayer().getQueue(interaction.guildId);

    if (!queue?.playing) {
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

    queue.clear();

    const loc = localizedString('global:queueHasBeenCleared', {
      lng: interaction.locale,
    });
    return await interaction.reply(loc);
  },
};

export default Clear;
