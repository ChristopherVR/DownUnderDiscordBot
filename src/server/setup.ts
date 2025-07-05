import { Awaitable } from 'discord.js';
import * as dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { rateLimit } from 'express-rate-limit';
import { logger } from '../helpers/logger/logger.js';
import * as url from 'url';
const __dirname = path.dirname(url.fileURLToPath(new URL('.', import.meta.url)));
dotenv.config();

export const setup = (callback: () => Promise<void> | Awaitable<void>) => {
  const hostname = process.env.HOST;
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  const protocol = process.env.PROTOCOL ?? 'http';

  if (!hostname || !port) {
    throw new Error('Need to specify a Hostname and Port in your env file.');
  }

  const server = express();

  server.set('title', 'Down Under Discord Bot');
  server.use('/locales', express.static(path.join(path.dirname(''), `/assets/locales`)));
  server.set('port', port);
  server.set('ipaddr', hostname);
  server.use('/components', express.static(path.join(path.dirname(''), `/components`)));
  server.use('/js', express.static(path.join(path.dirname(''), `/js`)));
  server.use('/icons', express.static(path.join(path.dirname(''), `/icons`)));
  server.set('views', path.join(path.dirname(''), `/views`));

  server.use(
    rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minute,
      max: 5,
    }),
  );

  server.get('/', (_, res) => res.sendFile(path.join(__dirname, '/index.html')));

  server.listen(port, hostname, () => {
    void callback();
    logger.info(`Server is running at ${protocol}://${hostname}:${port}/`);
  });
};
