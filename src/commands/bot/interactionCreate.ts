import { ChatInputCommandInteraction, Client, Interaction } from 'discord.js';
import { getCommands } from '../../commands';
import { cast } from '../helpers/cast';

const handleSlashCommand = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  try {
    const slashCommand = getCommands().find((cc) => cc.name === interaction.commandName);
    if (!slashCommand) {
      console.log('Unable to find slash command with name - ', interaction.commandName);
      await interaction.followUp({ content: 'An error has occurred' });
      return;
    }
    await slashCommand.run(interaction);
  } catch (er) {
    console.log('An error occurred trying to handle the command.', er);
  }
};

export default (client: Client): void => {
  client.on('interactionCreate', async (interaction: Interaction) => {
    if (interaction.isCommand() || interaction.isContextMenuCommand()) {
      await handleSlashCommand(cast<ChatInputCommandInteraction>(interaction));
    }
  });
};
