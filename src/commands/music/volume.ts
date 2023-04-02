import { ApplicationCommandOptionType, ChatInputCommandInteraction } from 'discord.js';
import { localizedString } from '../../helpers/localization';
import { PlayerCommand } from '../../types';
import setVolume from '../../utilities/volumeHandler';

import getLocalizations from '../../helpers/multiMapLocalization';

export const Volume: PlayerCommand = {
  name: localizedString('global:volume'),
  nameLocalizations: getLocalizations('global:volume'),
  description: localizedString('global:adjustVolume'),
  descriptionLocalizations: getLocalizations('global:adjustVolume'),
  voiceChannel: true,
  options: [
    {
      name: localizedString('volume'),
      nameLocalizations: getLocalizations('global:volume'),
      description: localizedString('global:amountOfVolume'),
      descriptionLocalizations: getLocalizations('global:amountOfVolume'),
      type: ApplicationCommandOptionType.Number,
      required: true,
      minValue: 1,
      maxValue: 100,
    },
  ],
  run: async (interaction: ChatInputCommandInteraction) => await setVolume(interaction),
};

export default Volume;
