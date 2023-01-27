import { defaultLanguage } from './commands/constants/localization';

export const localizedString: (key: string, args?: object) => string = (key: string, args?: object) =>
  global.instance.t(
    key,
    args ?? {
      lng: defaultLanguage,
    },
  );

export default localizedString;
