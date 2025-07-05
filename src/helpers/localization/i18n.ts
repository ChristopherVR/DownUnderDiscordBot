/* eslint-disable import/no-named-as-default-member */
/* eslint-disable import/default */
/* eslint-disable import/no-named-as-default */
/* eslint-disable import/namespace */
import i18next from 'i18next';
import HttpApi, { HttpBackendOptions } from 'i18next-http-backend';
import * as dotenv from 'dotenv';
import { logger } from '../logger/logger.js';

dotenv.config();

const hostname = process.env.HOST;
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const protocol = process.env.PROTOCOL ?? 'http';

const instance = i18next.use(HttpApi).createInstance();

/** Configures the base options for i18next translations.
 * @example
 * const instance = await i18n();
 *
 * @returns i18 next instance configured for translations.
 */
export const i18n = async () =>
  instance.use(HttpApi).init<HttpBackendOptions>(
    {
      fallbackLng: 'en-US',
      lng: 'en-US',
      debug: process.env.NODE_ENV === 'development',
      fallbackNS: 'global',
      defaultNS: 'global',
      load: 'currentOnly',
      initImmediate: false,
      ns: ['global', 'activity'],
      backend: {
        // allowMultiLoading: false,
        withCredentials: true,
        requestOptions: {
          mode: 'cors',
          credentials: 'same-origin',
          // cache: 'default',
        },
        loadPath: `${protocol}://${hostname}:${port}/locales/{{lng}}/{{ns}}.json`,
      },
    },
    (error: Error) => error && logger.error(error),
  );

globalThis.localization = instance;

export default i18n;
