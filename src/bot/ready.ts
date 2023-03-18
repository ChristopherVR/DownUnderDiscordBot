import { Client } from 'discord.js';
import { getCommands } from '../commands';

export default (client: Client): void => {
  client.on('ready', async () => {
    if (!client.user || !client.application) {
      return;
    }
    await client.application.commands.set(getCommands());

    console.log(`${client.user.username} is now connected.`);
  });
};
