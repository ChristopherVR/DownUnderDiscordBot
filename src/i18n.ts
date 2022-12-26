/* eslint-disable import/no-import-module-exports */
import i18next from 'i18next';
import HttpApi, { HttpBackendOptions } from 'i18next-http-backend';

export const instance = i18next.use(HttpApi).createInstance();
export const initInstance = async () =>
  await instance.use(HttpApi).init<HttpBackendOptions>(
    {
      fallbackLng: 'en-US',
      lng: 'en-US',
      debug: true,
      fallbackNS: 'global',
      defaultNS: 'global',
      load: 'currentOnly',
      initImmediate: false,
      ns: ['global', 'activity'],
      backend: {
        allowMultiLoading: false,
        withCredentials: true,
        requestOptions: {
          // used for fetch, can also be a function (payload) => ({ method: 'GET' })
          mode: 'cors',
          credentials: 'same-origin',
          cache: 'default',
        },
        // for all available options read the backend's repository readme file
        loadPath: 'http://localhost:3000/locales/{{lng}}/{{ns}}.json',
        // loadPath: '/locales/{{lng}}/{{ns}}.json',
      },
    },
    (error) => {
      console.log(error);
    },
  );

export const localizedString: (key: string, args?: object) => string = (key: string, args?: object) => {
  console.log(
    instance.t(key, {
      lng: 'en-US',
    }),
  );
  console.log(instance);

  return instance.t(
    key,
    args ?? {
      lng: 'en-US',
    },
  );
};
