import { ApplicationCommandType, ChatInputCommandInteraction, ApplicationCommandOptionType } from 'discord.js';
import { QueueFilters, AudioFilters } from 'discord-player';
import { ClientExtended, PlayerCommand } from '../../types';

import { getPlayer } from '../helpers/player';

export const Filter: PlayerCommand = {
  name: 'filter',
  description: 'add a filter to your track',
  voiceChannel: true,
  options: [
    {
      name: 'filter',
      description: 'filter you want to add',
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
  run: async (client: ClientExtended, interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      console.log('GuildId is undefined');
      return await interaction.reply({
        content: `Unable to handle your request. Please try again later.`,
        ephemeral: true,
      });
    }
    const queue = getPlayer().getQueue(interaction.guildId);

    if (!queue?.playing)
      return await interaction.reply({
        content: `No music currently playing ${interaction.member?.user.id ?? ''}... try again ? ❌`,
        ephemeral: true,
      });

    const actualFilter = queue.getFiltersEnabled()[0];

    const infilter = interaction.options.getString('filter') ?? '';

    const filters: Array<keyof QueueFilters> = [...queue.getFiltersEnabled(), ...queue.getFiltersDisabled()];

    const filter = filters.find((x) => x.toLowerCase() === infilter.toLowerCase());

    if (!filter)
      return await interaction.reply({
        content: `This filter doesn't exist ${interaction.member?.user.id ?? ''}... try again ? ❌\n${
          actualFilter ? `Filter currently active ${actualFilter}.\n` : ''
        }List of available filters ${filters.map((x) => `**${x}**`).join(', ')}.`,
        ephemeral: true,
      });

    const filtersUpdated: Record<string, unknown> = {};

    filtersUpdated[filter] = !queue.getFiltersEnabled().includes(filter);

    await queue.setFilters(filtersUpdated);

    return await interaction.reply({
      content: `The filter ${filter} is now **${
        queue.getFiltersEnabled().includes(filter) ? 'enabled' : 'disabled'
      }** ✅\n*Reminder the longer the music is, the longer this will take.*`,
    });
  },
};

export default Filter;
