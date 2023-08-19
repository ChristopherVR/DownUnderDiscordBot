import { Client } from 'discord.js';
import { COMMANDS } from '../../constants/commands.js';
import { logger } from '../logger/logger.js';

export default (client: Client): void => {
  client.on('ready', async () => {
    if (!client.user || !client.application) {
      return;
    }
    await client.application.commands.set(COMMANDS);
    logger(`${client.user.username} is now connected.`).info();
    /*
      TODO: Scan the discord audio channels and determine if any active developer is in a channel, and join the channel if anyone is available.
    */
  });
};
