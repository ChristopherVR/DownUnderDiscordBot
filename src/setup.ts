import { Awaitable } from 'discord.js';
import * as dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { rateLimit } from 'express-rate-limit';

dotenv.config();

// eslint-disable-next-line import/prefer-default-export
export const initServer = async (cb: () => Promise<void> | Awaitable<void>) => {
  const hostname = process.env.HOST;
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  if (!hostname || !port) {
    throw new Error('Need to specify a Hostname and Port in your env file.');
  }

  const server = express();

  server.set('title', 'Down Under Discord Bot');
  server.use('/locales', express.static(`${__dirname}/locales`));
  server.set('port', port);
  server.set('ipaddr', hostname);
  server.use('/components', express.static(`${__dirname}/components`));
  server.use('/js', express.static(`${__dirname}/js`));
  server.use('/icons', express.static(`${__dirname}/icons`));
  server.set('views', `${__dirname}/views`);

  server.use(
    rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minute,
      max: 5,
    }),
  );

  server.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
  });

  server.listen(port, hostname, async () => {
    await cb();
    console.log(`Server running at http://${hostname}:${port}/`);
  });
};
