import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from 'discord.js';
import { localizedString } from '../../i18n';
import { PlayerCommand } from '../../types';
import setLoop from '../../utilities/loopHandler';

import getLocalizations from '../i18n/discordLocalization';

export const Loop: PlayerCommand = {
  name: localizedString('global:loop'),
  description: localizedString('global:enableDisableLoopDescription'),
  nameLocalizations: getLocalizations('global:loop'),
  descriptionLocalizations: getLocalizations('global:enableDisableLoopDescription'),
  voiceChannel: true,
  options: [
    {
      name: localizedString('global:action'),
      description: localizedString('global:whatActionToPerform'),
      nameLocalizations: getLocalizations('global:action'),
      descriptionLocalizations: getLocalizations('global:whatActionToPerform'),
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: localizedString('global:queue'), value: 'enable_loop_queue' },
        { name: localizedString('global:disable'), value: 'disable_loop' },
        { name: localizedString('global:song'), value: 'enable_loop_song' },
      ],
    },
  ],
  type: ApplicationCommandType.ChatInput,

  run: async (interaction: ChatInputCommandInteraction) => {
    const type = interaction.options.data.map((x) => x.value).toString() as
      | 'enable_loop_queue'
      | 'disable_loop'
      | 'enable_loop_song';
    return setLoop(interaction, type, async (obj) => interaction.reply(obj));
  },
};

export default Loop;
