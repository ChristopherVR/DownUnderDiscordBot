import { ApplicationCommandType, ChatInputCommandInteraction } from 'discord.js';
import { localizedString } from '../../i18n';
import { PlayerCommand } from '../../types';
import pauseTrack from '../../utilities/pauseHandler';

import getLocalizations from '../i18n/discordLocalization';

export const Pause: PlayerCommand = {
  name: localizedString('global:pause'),
  description: localizedString('global:pauseTheCurrentTrack'),
  nameLocalizations: getLocalizations('global:pause'),
  descriptionLocalizations: getLocalizations('global:pauseTheCurrentTrack'),
  voiceChannel: true,

  type: ApplicationCommandType.ChatInput,

  run: async (interaction: ChatInputCommandInteraction) => {
    const res = pauseTrack(interaction, async (obj) => interaction.reply(obj));

    return res;
  },
};

export default Pause;
