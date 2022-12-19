import { ChatInputCommandInteraction, Client, Interaction } from 'discord.js';
import { Commands } from '../../commands';
import { cast } from '../helpers/cast';

const handleSlashCommand = async (c: Client, interaction: ChatInputCommandInteraction): Promise<void> => {
  const slashCommand = Commands.find((cc) => cc.name === interaction.commandName);
  if (!slashCommand) {
    await interaction.followUp({ content: 'An error has occurred' });
    return;
  }

  await interaction.deferReply();

  slashCommand.run(c, interaction);
};

export default (client: Client): void => {
  client.on('interactionCreate', async (interaction: Interaction) => {
    if (interaction.isCommand() || interaction.isContextMenuCommand()) {
      await handleSlashCommand(client, cast<ChatInputCommandInteraction>(interaction));
    }
  });
};
