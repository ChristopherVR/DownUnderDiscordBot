import { Player } from 'discord-player';
import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import { createServer } from 'http2';
import i18next from 'i18next';
import interactionCreate from './commands/bot/interactionCreate';
import ready from './commands/bot/ready';

dotenv.config();

const token = process.env.CLIENT_TOKEN;

const hostname = '127.0.0.1';
const port = 3000;

const server = createServer((req, res) => {
  res.statusCode = 200;
  const title = 'MEIN BOT';
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
      body { margin:0; height:100vh; display:flex; align-items:center; justify-content:center; font-family:monospace; color:#007bff }
    </style>
  </head>
  <body>
    <h1>${title}</h1>
  </body>
  </html>`);
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates],
});

ready(client);
interactionCreate(client);

client.on('ready', () => {
  const value = i18next.t('activity:default');
  client.user?.setActivity(value);
});

client.login(token);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).player = new Player(client);
