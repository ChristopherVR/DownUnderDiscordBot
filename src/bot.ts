/* eslint-disable @typescript-eslint/no-var-requires */
import { Player } from 'discord-player';
import { Client, GatewayIntentBits } from 'discord.js';

import { localizedString } from './i18n';
import initInstance from './i18nSetup';
import { initServer } from './setup';

const token = process.env.CLIENT_TOKEN;

const init = async () => {
  await initInstance();

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates],
  });

  // eslint-disable-next-line global-require
  const registerOnReadyListener: (c: Client) => void = require('./bot/ready').default;
  registerOnReadyListener(client);

  // eslint-disable-next-line global-require
  const registerInteractionCreateListener: (c: Client) => void = require('./bot/interactionCreate').default;

  registerInteractionCreateListener(client);

  client.on('ready', () => {
    const value = localizedString('activity:default');
    client.user?.setActivity(value);
  });
  await client.login(token);
  global.player = new Player(client);

  // Temp fix for https://github.com/discordjs/discord.js/issues/9185#issuecomment-1452510633
  global.player.on('connectionCreate', (queue) => {
    queue.connection.voiceConnection.on('stateChange', (oldState, newState) => {
      const oldNetworking = Reflect.get(oldState, 'networking');
      const newNetworking = Reflect.get(newState, 'networking');

      const networkStateChangeHandler = (_oldNetworkState: object, newNetworkState: object) => {
        const newUdp = Reflect.get(newNetworkState, 'udp');
        clearInterval(newUdp?.keepAliveInterval);
      };

      oldNetworking?.off('stateChange', networkStateChangeHandler);
      newNetworking?.on('stateChange', networkStateChangeHandler);
    });
  });
};

const setup = async () => await initServer(init);

setup();
