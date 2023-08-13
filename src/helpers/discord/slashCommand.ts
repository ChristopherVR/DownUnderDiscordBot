import { ChatInputCommandInteraction, Client, GatewayDispatchEvents, InteractionType } from 'discord.js';
import { command } from './command.js';
import { logger } from '../logger/logger.js';

const handleSlashCommand = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  try {
    await command(interaction.commandName).setup(interaction).run();
  } catch (er) {
    if (!interaction.replied) {
      await interaction.reply('An internal server error occurred. Unable to handle request.');
    }
    logger('An error occurred trying to handle the command. Error: ', er).error();
  }
};

export default (client: Client): void => {
  client.on('interactionCreate', async (interaction) => {
    if (interaction.type !== InteractionType.ApplicationCommand) {
      return;
    }

    await handleSlashCommand(interaction as ChatInputCommandInteraction);
  });
};
