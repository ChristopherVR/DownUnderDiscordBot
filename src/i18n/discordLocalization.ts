import { Locale, LocalizationMap } from 'discord.js';
import { localizedString } from '../i18n';
import { defaultLanguage } from '../constants/localization';

const getLocalizations = (key: string): LocalizationMap | undefined => {
  const localizations: { [x: string]: string }[] = [];

  Object.values(Locale).forEach((y) => {
    // console.log('The locale is ', y);

    const loc = localizedString(key, {
      lng: y,
      fallbackLng: defaultLanguage,
    });

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
  return localizationMap;
};

export default getLocalizations;
