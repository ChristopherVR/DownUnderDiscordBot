// eslint-disable-next-line import/namespace
import { i18n } from 'i18next';

type Localization = i18n;

declare global {
  var localization: Localization;
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
      CLIENT_TOKEN: string;
      OPEN_AI_TOKEN?: string;
      HOST: string;
      PORT: string;
      PROTOCOL: 'http' | 'https';
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
