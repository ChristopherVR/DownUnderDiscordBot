import * as dotenv from 'dotenv';
import express from 'express';
import path from 'path';

dotenv.config();

// eslint-disable-next-line import/prefer-default-export
export const initSetup = async (cb: () => Promise<void>) => {
  const hostname = process.env.HOST;
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  if (!hostname || !port) {
    throw new Error('Need to specify a Hostname and Port in your env file.');
  }

  const server = express();

  server.set('title', 'Nein Discord Bot');
  server.use('/locales', express.static(`${__dirname}/locales`));
  server.set('port', port);
  server.set('ipaddr', hostname);
  server.use('/components', express.static(`${__dirname}/components`));
  server.use('/js', express.static(`${__dirname}/js`));
  server.use('/icons', express.static(`${__dirname}/icons`));
  server.set('views', `${__dirname}/views`);

  server.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
  });

  server.listen(port, hostname, async () => {
    await cb();
    console.log(`Server running at http://${hostname}:${port}/`);
  });
};
