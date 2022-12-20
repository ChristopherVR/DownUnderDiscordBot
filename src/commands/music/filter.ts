import { ApplicationCommandType, ChatInputCommandInteraction, ApplicationCommandOptionType } from 'discord.js';
import { QueueFilters, AudioFilters } from 'discord-player';
import i18next from 'i18next';
import { PlayerCommand } from '../../types';

import { getPlayer } from '../helpers/player';
import getLocalizations from '../i18n/discordLocalization';

export const Filter: PlayerCommand = {
  name: i18next.t('global:filter'),
  description: i18next.t('global:addFilterToTrack'),
  nameLocalizations: getLocalizations('global:filter'),
  descriptionLocalizations: getLocalizations('global:addFilterToTrack'),

  voiceChannel: true,
  options: [
    {
      name: i18next.t('global:filter'),
      description: i18next.t('global:filterYouWantToAdd'),
      nameLocalizations: getLocalizations('global:filter'),
      descriptionLocalizations: getLocalizations('global:filterYouWantToAdd'),
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        ...Object.keys(AudioFilters.filters)
          .map((m) => Object({ name: m, value: m }))
          .splice(0, 25),
      ],
    },
  ],
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

    const actualFilter = queue.getFiltersEnabled()[0];

    const infilter = interaction.options.getString('filter') ?? '';

    const filters: Array<keyof QueueFilters> = [...queue.getFiltersEnabled(), ...queue.getFiltersDisabled()];

    const filter = filters.find((x) => x.toLowerCase() === infilter.toLowerCase());

    if (!filter) {
      const loc = i18next.t('global:filterDoesNotExist', {
        lng: interaction.locale,
      });

      const listAvailableFiltersLoc = i18next.t('global:filterCurrentlyActive', {
        lng: interaction.locale,
        filters: filters.map((x) => `**${x}**`).join(', '),
      });
      const filterActiveLoc = i18next.t('global:filterCurrentlyActive', {
        lng: interaction.locale,
        activeFilter: actualFilter,
      });

      return await interaction.reply({
        content: `${loc}\n${actualFilter ? filterActiveLoc : ''}\n${filters.length ? listAvailableFiltersLoc : ''}.`,
        ephemeral: true,
      });
    }

    const filtersUpdated: Record<string, unknown> = {};

    filtersUpdated[filter] = !queue.getFiltersEnabled().includes(filter);

    await queue.setFilters(filtersUpdated);
    const loc = i18next.t('global:filterIsNow', {
      lng: interaction.locale,
      filter,
      // TODO: Handle this better
      status: queue.getFiltersEnabled().includes(filter) ? i18next.t('global:enabled') : i18next.t('global:disabled'),
    });
    return await interaction.reply({
      content: loc,
    });
  },
};

export default Filter;
