import { ApplicationCommandType, ChatInputCommandInteraction } from 'discord.js';
import i18next from 'i18next';
import { PlayerCommand } from '../../types';
import { getPlayer } from '../helpers/player';
import getLocalizations from '../i18n/discordLocalization';

export const Clear: PlayerCommand = {
  name: i18next.t('global:clear'),
  description: i18next.t('global:clearAllInQueue'),
  nameLocalizations: getLocalizations('global:clear'),
  descriptionLocalizations: getLocalizations('global:clearAllInQueue'),
  voiceChannel: true,
  type: ApplicationCommandType.ChatInput,
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
      const loc = i18next.t('global:noMusicCurrentlyPlaying', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: loc,
        ephemeral: true,
      });
    }

    if (!queue.tracks[0]) {
      const loc = i18next.t('global:noTrackInQueue', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: loc,
        ephemeral: true,
      });
    }

    queue.clear();

    const loc = i18next.t('global:queueHasBeenCleared', {
      lng: interaction.locale,
    });
    return await interaction.reply(loc);
  },
};

export default Clear;
