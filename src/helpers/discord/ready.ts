import { Client } from 'discord.js';
import { COMMANDS } from '../../constants/commands.js';

export default (client: Client): void => {
  client.on('ready', async () => {
    if (!client.user || !client.application) {
      return;
    }
    await client.application.commands.set(COMMANDS);
    console.log(`${client.user.username} is now connected.`);
    /*
      TODO: Scan the discord audio channels and determine if any active developer is in a channel, and join the channel if anyone is available.
    */
  });
};
