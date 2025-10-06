import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

const namespaces = ['common', 'ui', 'errors', 'commands'] as const;

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    debug: false,

    interpolation: {
      escapeValue: false,
    },

    backend: {
      loadPath: '/api/locales/{{lng}}/{{ns}}.json',
    },

    ns: namespaces,
    defaultNS: 'common',
    fallbackNS: ['ui'],
    react: {
      useSuspense: false,
    },
  })
  .catch((error) => {
    console.error('[i18n] Failed to initialise translations', error);
  });

export default i18n;
