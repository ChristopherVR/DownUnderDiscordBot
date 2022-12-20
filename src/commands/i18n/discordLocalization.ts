import { Locale, LocalizationMap } from 'discord.js';
import i18next from 'i18next';

const getLocalizations = (key: string): LocalizationMap => {
  const localizations = Object.values(Locale).map((y) => ({
    [y]: i18next.t(key, {
      lng: y ?? '',
    }),
  }));
  const localizationMap: LocalizationMap = Object.assign({}, ...localizations);

  return localizationMap;
};

export default getLocalizations;
