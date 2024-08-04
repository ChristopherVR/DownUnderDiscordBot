// eslint-disable-next-line import/namespace
import { i18n } from 'i18next';

type Localization = i18n;

declare global {
  var localization: Localization;
  namespace NodeJS {
    interface ProcessEnv {
      readonly NODE_ENV: 'development' | 'production';
      readonly CLIENT_TOKEN: string;
      readonly OPEN_AI_TOKEN?: string;
      readonly HOST: string;
      readonly PORT: string;
      readonly PROTOCOL: 'http' | 'https';
      readonly MUSIC_FOLDER_PATH: string;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
