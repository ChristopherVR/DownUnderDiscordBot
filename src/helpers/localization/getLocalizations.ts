import { Locale, LocalizationMap } from 'discord.js';
import { logger } from '../logger/logger.js';
import { localizedString } from './localizedString.js';

/** Gets the localized values for all available locales supported by DiscordJS for the given string.
 * @default
 * en-US will be used as a fallback for the language value.
 */
const getLocalizations = (key: string): LocalizationMap | undefined => {
  const localizations: { [x: string]: string }[] = [];

  Object.values(Locale).forEach((y) => {
    logger('Locale: ', y, ' Key: ', key).debug();
    const response = localizedString(key, {
      lng: y,
      skipFallback: true,
    });
    if (response) {
      localizations.push({
        [y]: response,
      });
    }
  });

  if (!localizations.length) {
    return undefined;
  }
  const localizationMap: LocalizationMap = Object.assign({}, ...localizations);
  return localizationMap;
};

export default getLocalizations;
