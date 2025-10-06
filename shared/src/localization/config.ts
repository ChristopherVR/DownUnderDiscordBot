import i18next, { type InitOptions, type TFunction } from 'i18next';
import HttpBackend from 'i18next-http-backend';

export interface I18nConfig {
  isServer?: boolean;
  lng?: string;
  debug?: boolean;
  loadPath?: string;
}

export const NAMESPACES = {
  COMMON: 'common',
  ERRORS: 'errors',
  COMMANDS: 'commands',
  UI: 'ui',
} as const;

const NAMESPACE_LIST = Object.values(NAMESPACES);
const DEFAULT_PRELOAD_LANGS = ['en'] as const;

let initMode: 'server' | 'client' | null = null;
let pendingInit: Promise<TFunction> | null = null; // avoid duplicate in-flight initialisations

const ensureLanguage = async (lng: string) => {
  if (i18next.language !== lng) {
    await i18next.changeLanguage(lng);
  }
};

const resolveServerLoadPath = async (customPath?: string): Promise<string> => {
  if (customPath) {
    return customPath;
  }

  const [{ fileURLToPath }, path] = await Promise.all([
    import('node:url'),
    import('node:path'),
  ]);

  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  return path.join(moduleDir, '..', '..', 'src', 'localization', 'locales', '{{lng}}', '{{ns}}.json');
};

const buildMissingKeyHandler = (debug: boolean): InitOptions['missingKeyHandler'] =>
  debug
    ? (languages: readonly string[], namespace: string, key: string) => {
        const joinedLanguages = Array.isArray(languages) ? languages.join(', ') : String(languages);
        console.warn(`Missing translation key: ${namespace}:${key} for language(s): ${joinedLanguages}`);
      }
    : undefined;

export const initI18n = async (config: I18nConfig = {}): Promise<TFunction> => {
  const { isServer = false, lng = 'en', debug = process.env.NODE_ENV === 'development', loadPath } = config;
  const mode: 'server' | 'client' = isServer ? 'server' : 'client';

  if (i18next.isInitialized && initMode === mode) {
    await ensureLanguage(lng);
    return i18next.getFixedT(lng);
  }

  if (pendingInit) {
    const tFunction = await pendingInit;
    await ensureLanguage(lng);
    return tFunction;
  }

  pendingInit = (async () => {
    let initResult: TFunction;
    const missingKeyHandler = buildMissingKeyHandler(debug);

    if (mode === 'server') {
      const { default: FsBackend } = await import('i18next-fs-backend');
      i18next.use(FsBackend);
      const resolvedLoadPath = await resolveServerLoadPath(loadPath);
      const options: InitOptions = {
        lng,
        fallbackLng: 'en',
        debug,
        interpolation: { escapeValue: false },
        backend: { loadPath: resolvedLoadPath },
        ns: NAMESPACE_LIST,
        defaultNS: NAMESPACES.COMMON,
        react: { useSuspense: false },
        saveMissing: debug,
        missingKeyHandler,
        preload: [...DEFAULT_PRELOAD_LANGS],
        cache: { enabled: !debug },
      };
      initResult = await i18next.init(options);
    } else {
      i18next.use(HttpBackend);
      const resolvedLoadPath = loadPath ?? '/locales/{{lng}}/{{ns}}.json';
      const options: InitOptions = {
        lng,
        fallbackLng: 'en',
        debug,
        interpolation: { escapeValue: false },
        backend: { loadPath: resolvedLoadPath },
        ns: NAMESPACE_LIST,
        defaultNS: NAMESPACES.COMMON,
        react: { useSuspense: false },
        saveMissing: debug,
        missingKeyHandler,
        preload: [...DEFAULT_PRELOAD_LANGS],
        cache: { enabled: !debug },
      };
      initResult = await i18next.init(options);
    }

    initMode = mode;
    return initResult;
  })();

  try {
    const tFunction = await pendingInit;
    await ensureLanguage(lng);
    return tFunction;
  } finally {
    pendingInit = null;
  }
};

export default i18next;

export type Namespace = (typeof NAMESPACES)[keyof typeof NAMESPACES];
