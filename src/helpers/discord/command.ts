import { ChatInputCommandInteraction } from 'discord.js';
import { COMMANDS } from '../../constants/commands.js';
import { useLocalizedString } from '../localization/localizedString.js';
import { logger } from '../logger/logger.js';
import { DefaultLoggerMessage } from '../../enums/logger.js';

/** Provides an object to run a discord slash command.
 * @example
 * const play = command('play');
 *
 * await play.run();
 */
export const command = (name: string) => {
  const setup = (interaction: ChatInputCommandInteraction) => {
    const command = COMMANDS.find((cmd) => cmd.name === name);

    if (!command) {
      logger(`Command ${name} does not exist.`).error();
    }

    const run = async () => {
      if (!command) {
        const { localize } = useLocalizedString(interaction.locale);
        logger(DefaultLoggerMessage.UnableToFindSlashCommand, interaction.commandName).error();
        const errMsg = localize('global:unableToFindCommand');

        await interaction.followUp({ content: errMsg });
        return;
      }

      await command.run(interaction);
    };

    return {
      run,
    };
  };

  return {
    setup,
  };
};
