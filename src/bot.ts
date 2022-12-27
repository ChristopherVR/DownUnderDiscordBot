import { Player } from 'discord-player';
import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
import { localizedString } from './i18n';
import initInstance from './i18nSetup';
import { initSetup } from './setup';

dotenv.config();
const token = process.env.CLIENT_TOKEN;
const init = async () => {
  await initInstance();

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates],
  });

  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const ready = require('./commands/bot/ready').default;
  ready(client);
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const interactionCreate = require('./commands/bot/interactionCreate').default;
  interactionCreate(client);
  client.on('ready', () => {
    const value = localizedString('activity:default');
    client.user?.setActivity(value);
  });
  await client.login(token);
  global.player = new Player(client);
};

const setup = async () => await initSetup(init);

setup();
