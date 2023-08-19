import { Locale } from 'discord.js';
import { DEFAULT_LANGUAGE } from '../../constants/localization.js';
import { logger } from '../logger/logger.js';
import { DefaultLoggerMessage } from '../../enums/logger.js';

type LocalizedStringOptions = Record<string, unknown>;

/** Hook to provide a localize function that will retrieve a string value based on the Locale specified. */
export const useLocalizedString = (loc: Locale = Locale.EnglishUS) => {
  return {
    localize: (key: string, args?: LocalizedStringOptions) =>
      localizedString(key, { ...args, lng: loc ?? Locale.EnglishUS }),
  };
};

export const localizedString: (key: string, args?: LocalizedStringOptions) => string = (
  key: string,
  args?: LocalizedStringOptions,
) => {
  const params = typeof args === 'string' ? { lng: args } : args;

  if (params?.debug) {
    return key;
  }

  if (!global.localization) {
    logger(DefaultLoggerMessage.LocaleInstanceNotAvailable).error();

    if (params?.strict) {
      throw new TypeError('Failed to retrieve localization value. The global localization instance is not available.');
    }

    return '';
  }

  const value = global.localization.t(
    key,
    params ?? {
      lng: DEFAULT_LANGUAGE,
    },
  );

  return value;
};
