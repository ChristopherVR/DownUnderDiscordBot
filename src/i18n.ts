import i18next from 'i18next';
import Backend from 'i18next-http-backend';

i18next.use(Backend).init({
  fallbackLng: 'en-US',

  debug: process.env.NODE_ENV === 'development',
  fallbackNS: 'global',
  defaultNS: 'global',
  load: 'currentOnly',
  ns: ['global', 'activity'],
  backend: {
    // for all available options read the backend's repository readme file
    loadPath: '/locales/{{lng}}/{{ns}}.json',
  },
});
