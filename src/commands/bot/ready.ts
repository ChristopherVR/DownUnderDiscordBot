import { Client } from 'discord.js';
import { Commands } from '../../commands';

export default (client: Client): void => {
  client.on('ready', async () => {
    if (!client.user || !client.application) {
      return;
    }
    await client.application.commands.set(Commands);

    // eslint-disable-next-line no-console
    console.log('Führer online. Get in loser, time to invade poland!');
  });
};
