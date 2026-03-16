import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted so mock fns are available inside the vi.mock factory (which is hoisted)
const { mockInit, mockChangeLanguage, mockGetFixedT, mockUse } = vi.hoisted(() => ({
  mockInit: vi.fn().mockResolvedValue(vi.fn()),
  mockChangeLanguage: vi.fn().mockResolvedValue(undefined),
  mockGetFixedT: vi.fn().mockReturnValue(vi.fn()),
  mockUse: vi.fn().mockReturnThis(),
}));

vi.mock('i18next', () => {
  return {
    default: {
      isInitialized: false,
      language: 'en',
      init: mockInit,
      changeLanguage: mockChangeLanguage,
      getFixedT: mockGetFixedT,
      use: mockUse,
      t: vi.fn((key: string) => key),
    },
  };
});

vi.mock('i18next-http-backend', () => {
  return {
    default: class HttpBackend {
      type = 'backend' as const;
    },
  };
});

vi.mock('i18next-fs-backend', () => {
  return {
    default: class FsBackend {
      type = 'backend' as const;
    },
  };
});

describe('NAMESPACES', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('should export the correct namespace constants', async () => {
    const { NAMESPACES } = await import('@/localization/config');

    expect(NAMESPACES.COMMON).toBe('common');
    expect(NAMESPACES.ERRORS).toBe('errors');
    expect(NAMESPACES.COMMANDS).toBe('commands');
    expect(NAMESPACES.UI).toBe('ui');
  });

  it('should have exactly four namespaces', async () => {
    const { NAMESPACES } = await import('@/localization/config');
    const values = Object.values(NAMESPACES);
    expect(values).toHaveLength(4);
    expect(values).toEqual(['common', 'errors', 'commands', 'ui']);
  });
});

describe('I18nConfig interface', () => {
  it('should accept empty config', async () => {
    const { initI18n } = await import('@/localization/config');
    // initI18n accepts an empty config object or no arguments
    expect(() => initI18n({})).not.toThrow();
  });

  it('should accept full config', async () => {
    const { initI18n } = await import('@/localization/config');
    const config = {
      isServer: false,
      lng: 'en',
      debug: false,
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    };
    expect(() => initI18n(config)).not.toThrow();
  });
});

describe('initI18n', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    // Reset mocked i18next state for each test
    const i18next = (await import('i18next')).default;
    (i18next as unknown as Record<string, unknown>).isInitialized = false;
    (i18next as unknown as Record<string, unknown>).language = 'en';
  });

  it('should initialize i18next in client mode by default', async () => {
    const { initI18n } = await import('@/localization/config');
    const i18next = (await import('i18next')).default;

    await initI18n();

    expect(i18next.use).toHaveBeenCalled();
    expect(i18next.init).toHaveBeenCalledWith(
      expect.objectContaining({
        lng: 'en',
        fallbackLng: 'en',
        interpolation: { escapeValue: false },
        ns: ['common', 'errors', 'commands', 'ui'],
        defaultNS: 'common',
      }),
    );
  });

  it('should use the provided language', async () => {
    const { initI18n } = await import('@/localization/config');
    const i18next = (await import('i18next')).default;

    await initI18n({ lng: 'fr' });

    expect(i18next.init).toHaveBeenCalledWith(
      expect.objectContaining({
        lng: 'fr',
      }),
    );
  });

  it('should use custom loadPath for client mode', async () => {
    const { initI18n } = await import('@/localization/config');
    const i18next = (await import('i18next')).default;

    await initI18n({ loadPath: '/custom/{{lng}}/{{ns}}.json' });

    expect(i18next.init).toHaveBeenCalledWith(
      expect.objectContaining({
        backend: { loadPath: '/custom/{{lng}}/{{ns}}.json' },
      }),
    );
  });

  it('should use default client loadPath when none provided', async () => {
    const { initI18n } = await import('@/localization/config');
    const i18next = (await import('i18next')).default;

    await initI18n({ isServer: false });

    expect(i18next.init).toHaveBeenCalledWith(
      expect.objectContaining({
        backend: { loadPath: '/locales/{{lng}}/{{ns}}.json' },
      }),
    );
  });

  it('should configure react with useSuspense false', async () => {
    const { initI18n } = await import('@/localization/config');
    const i18next = (await import('i18next')).default;

    await initI18n();

    expect(i18next.init).toHaveBeenCalledWith(
      expect.objectContaining({
        react: { useSuspense: false },
      }),
    );
  });

  it('should set interpolation escapeValue to false', async () => {
    const { initI18n } = await import('@/localization/config');
    const i18next = (await import('i18next')).default;

    await initI18n();

    expect(i18next.init).toHaveBeenCalledWith(
      expect.objectContaining({
        interpolation: { escapeValue: false },
      }),
    );
  });

  it('should preload English by default', async () => {
    const { initI18n } = await import('@/localization/config');
    const i18next = (await import('i18next')).default;

    await initI18n();

    expect(i18next.init).toHaveBeenCalledWith(
      expect.objectContaining({
        preload: ['en'],
      }),
    );
  });

  it('should return already initialized i18next for same mode', async () => {
    const { initI18n } = await import('@/localization/config');
    const i18next = (await import('i18next')).default;

    // First call initializes
    await initI18n({ isServer: false });

    // Simulate initialized state
    (i18next as unknown as Record<string, unknown>).isInitialized = true;

    // Second call should return the fixed T function
    const _result = await initI18n({ isServer: false });
    expect(i18next.getFixedT).toHaveBeenCalledWith('en');
  });
});

describe('Namespace type', () => {
  it('should be a union of namespace string values', async () => {
    const { NAMESPACES } = await import('@/localization/config');
    // Verify the namespace values match expected string literals
    const namespaceValues: string[] = Object.values(NAMESPACES);
    expect(namespaceValues).toContain('common');
    expect(namespaceValues).toContain('errors');
    expect(namespaceValues).toContain('commands');
    expect(namespaceValues).toContain('ui');
  });
});
