import i18next from 'i18next';
import HttpApi, { HttpBackendOptions } from 'i18next-http-backend';
import * as dotenv from 'dotenv';

dotenv.config();

const hostname = process.env.HOST;
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
console.log('host is', hostname);
console.log('port is ', port);
const instance = i18next.use(HttpApi).createInstance();
export const initInstance = async () =>
  await instance.use(HttpApi).init<HttpBackendOptions>(
    {
      fallbackLng: 'en-US',
      lng: 'en-US',
      debug: true,
      fallbackNS: 'global',
      defaultNS: 'global',
      load: 'currentOnly',
      initImmediate: false,
      ns: ['global', 'activity'],
      backend: {
        allowMultiLoading: false,
        withCredentials: true,
        requestOptions: {
          mode: 'cors',
          credentials: 'same-origin',
          cache: 'default',
        },
        loadPath: `http://${hostname}:${port}/locales/{{lng}}/{{ns}}.json`,
      },
    },
    (error) => {
      if (error) {
        console.log(error);
      }
    },
  );

global.instance = instance;

export default initInstance;
