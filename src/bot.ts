import { Player } from 'discord-player';
import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import express from 'express';
import path from 'path';
import { initInstance, localizedString } from './i18n';

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
  client.login(token);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).player = new Player(client);
};
const hostname = '127.0.0.1';
const port = 3000;

const server = express();

server.set('title', 'Nein Discord Bot');
server.use('/locales', express.static(`${__dirname}/locales`));
server.set('port', port);
server.set('ipaddr', hostname);
server.use('/components', express.static(`${__dirname}/components`));
server.use('/js', express.static(`${__dirname}/js`));
server.use('/icons', express.static(`${__dirname}/icons`));
server.set('views', `${__dirname}/views`);

server.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/index.html'));
});

server.listen(port, hostname, async () => {
  await init();
  console.log(`Server running at http://${hostname}:${port}/`);
});
