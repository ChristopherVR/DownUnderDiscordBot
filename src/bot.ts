/* eslint-disable @typescript-eslint/no-var-requires */
import { Player } from 'discord-player';
import { Client, GatewayIntentBits } from 'discord.js';

import { localizedString } from './helpers/localization';
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

  Player.singleton(client);
};

const setup = async () => await initServer(init);

setup();
