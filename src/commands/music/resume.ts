import { ChatInputCommandInteraction } from 'discord.js';
import { localizedString } from '../../helpers/localization';
import { PlayerCommand } from '../../types';
import resumeTrack from '../../utilities/resumeHandler';

import getLocalizations from '../../helpers/multiMapLocalization';

export const Resume: PlayerCommand = {
  name: localizedString('global:resume'),
  description: localizedString('global:playTheTrack'),
  nameLocalizations: getLocalizations('global:resume'),
  descriptionLocalizations: getLocalizations('global:playTheTrack'),
  voiceChannel: true,
  run: async (interaction: ChatInputCommandInteraction) => await resumeTrack(interaction),
};

export default Resume;
