import { i18n } from 'i18next';

type Localization = i18n;

declare global {
  // eslint-disable-next-line vars-on-top, no-var
  var localization: Localization;
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
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
