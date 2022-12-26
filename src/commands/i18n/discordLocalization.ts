import { Locale, LocalizationMap } from 'discord.js';
import { localizedString } from '../../i18n';

const getLocalizations = (key: string): LocalizationMap | undefined => {
  const localizations: { [x: string]: string }[] = [];

  Object.values(Locale).forEach((y) => {
    // console.log('The locale is ', y);

    const loc = localizedString(key, {
      lng: y,
      fallbackLng: 'en-US',
    });

    // console.log('The key ', key, ' for the locale value for ', y, ' is ', loc);
    if (loc) {
      localizations.push({
        [y]: loc,
      });
    }
  });

  if (!localizations.length) {
    return undefined;
  }
  const localizationMap: LocalizationMap = Object.assign({}, ...localizations);

  // console.log('the localization map looks like follow', localizationMap);
  return localizationMap;
};

export default getLocalizations;
