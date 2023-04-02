import { ChatInputCommandInteraction } from 'discord.js';
import { localizedString } from '../../helpers/localization';
import { PlayerCommand } from '../../types';
import saveTrack from '../../utilities/saveTrackHandler';

import getLocalizations from '../../helpers/multiMapLocalization';

export const Save: PlayerCommand = {
  name: localizedString('global:save'),
  description: localizedString('global:saveThisTrack'),
  nameLocalizations: getLocalizations('global:save'),
  descriptionLocalizations: getLocalizations('global:saveThisTrack'),
  voiceChannel: true,
  run: async (interaction: ChatInputCommandInteraction) =>
    await saveTrack(interaction, async (obj) => interaction.reply(obj)),
};

export default Save;
