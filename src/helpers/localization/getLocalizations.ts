import { Locale, LocalizationMap } from 'discord.js';
import { localizedString } from './localizedString.js';

/** Gets the localized values for all available locales supported by DiscordJS for the given string.
 * @example
 * const localizations = getLocalizations('global:helloWorld');
 *
 * console.log(localizations); // Outputs object - { 'en-US': 'Hello World!', 'af': 'Hallo Wêreld!'};
 */
const getLocalizations = (key: string): LocalizationMap | undefined => {
  const localizations: Record<string, string>[] = [];

  Object.values(Locale).forEach((y) => {
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
  const localizationMap: LocalizationMap = Object.assign({}, ...localizations) as LocalizationMap;
  return localizationMap;
};

export default getLocalizations;
