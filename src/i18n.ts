export const localizedString: (key: string, args?: object) => string = (key: string, args?: object) =>
  global.instance.t(
    key,
    args ?? {
      lng: 'en-US',
    },
  );

export default localizedString;
