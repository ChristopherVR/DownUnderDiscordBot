import { ApplicationCommandType, ChatInputCommandInteraction, ApplicationCommandOptionType } from 'discord.js';
import { QueueFilters, AudioFilters } from 'discord-player';
import { localizedString } from '../../i18n';
import { PlayerCommand } from '../../types';

import getLocalizations from '../i18n/discordLocalization';

export const Filter: PlayerCommand = {
  name: localizedString('global:filter'),
  description: localizedString('global:addFilterToTrack'),
  nameLocalizations: getLocalizations('global:filter'),
  descriptionLocalizations: getLocalizations('global:addFilterToTrack'),

  voiceChannel: true,
  options: [
    {
      name: localizedString('global:filter'),
      description: localizedString('global:filterYouWantToAdd'),
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
      const loc = localizedString('global:noMusicCurrentlyPlaying', {
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
      const loc = localizedString('global:filterDoesNotExist', {
        lng: interaction.locale,
      });

      const listAvailableFiltersLoc = localizedString('global:filterCurrentlyActive', {
        lng: interaction.locale,
        filters: filters.map((x) => `**${x}**`).join(', '),
      });
      const filterActiveLoc = localizedString('global:filterCurrentlyActive', {
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
    const loc = localizedString('global:filterIsNow', {
      lng: interaction.locale,
      filter,
      // TODO: Handle this better
      status: queue.getFiltersEnabled().includes(filter)
        ? localizedString('global:enabled', {
            lng: interaction.locale,
          })
        : localizedString('global:disabled', {
            lng: interaction.locale,
          }),
    });
    return await interaction.reply({
      content: loc,
    });
  },
};

export default Filter;
