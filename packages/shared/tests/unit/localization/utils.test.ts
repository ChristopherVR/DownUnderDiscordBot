import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted so mock fns are available inside the vi.mock factory (which is hoisted)
const { mockT, mockChangeLanguage, mockExists } = vi.hoisted(() => ({
  mockT: vi.fn((key: string, options?: Record<string, unknown>) => {
    if (options?.ns) return `[${options.ns}] ${key}`;
    return key;
  }),
  mockChangeLanguage: vi.fn().mockResolvedValue(undefined),
  mockExists: vi.fn((key: string) => key !== 'nonexistent'),
}));

vi.mock('i18next', () => ({
  default: {
    isInitialized: true,
    language: 'en',
    t: mockT,
    changeLanguage: mockChangeLanguage,
    exists: mockExists,
  },
}));

import {
  t,
  tCommon,
  tErrors,
  tCommands,
  tUI,
  isI18nReady,
  getCurrentLanguage,
  changeLanguage,
  getAvailableLanguages,
  formatError,
  getCommandInfo,
  hasTranslation,
} from '@/localization/utils';

describe('t (generic translation function)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call i18next.t with the key', () => {
    t('hello');
    expect(mockT).toHaveBeenCalledWith('hello', undefined);
  });

  it('should pass options to i18next.t', () => {
    t('greeting', { name: 'World' });
    expect(mockT).toHaveBeenCalledWith('greeting', { name: 'World' });
  });

  it('should pass namespace in options when provided', () => {
    t('key', {}, 'errors');
    expect(mockT).toHaveBeenCalledWith('key', { ns: 'errors' });
  });

  it('should handle namespace without extra options', () => {
    t('key', undefined, 'ui');
    expect(mockT).toHaveBeenCalledWith('key', { ns: 'ui' });
  });
});

describe('namespace-specific translation functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('tCommon should use the common namespace', () => {
    tCommon('buttons.play');
    expect(mockT).toHaveBeenCalledWith('buttons.play', { ns: 'common' });
  });

  it('tErrors should use the errors namespace', () => {
    tErrors('connection.failed');
    expect(mockT).toHaveBeenCalledWith('connection.failed', { ns: 'errors' });
  });

  it('tCommands should use the commands namespace', () => {
    tCommands('play.name');
    expect(mockT).toHaveBeenCalledWith('play.name', { ns: 'commands' });
  });

  it('tUI should use the ui namespace', () => {
    tUI('dashboard.title');
    expect(mockT).toHaveBeenCalledWith('dashboard.title', { ns: 'ui' });
  });

  it('tCommon should pass extra options along with namespace', () => {
    tCommon('greeting', { name: 'User' });
    expect(mockT).toHaveBeenCalledWith('greeting', { name: 'User', ns: 'common' });
  });

  it('tErrors should pass extra options along with namespace', () => {
    tErrors('upload.fileTooBig', { maxSize: 10 });
    expect(mockT).toHaveBeenCalledWith('upload.fileTooBig', { maxSize: 10, ns: 'errors' });
  });
});

describe('isI18nReady', () => {
  it('should return true when i18next is initialized', () => {
    expect(isI18nReady()).toBe(true);
  });

  it('should return false when i18next is not initialized', async () => {
    const i18next = (await import('i18next')).default;
    const original = i18next.isInitialized;
    (i18next as unknown as Record<string, unknown>).isInitialized = false;

    expect(isI18nReady()).toBe(false);

    (i18next as unknown as Record<string, unknown>).isInitialized = original;
  });
});

describe('getCurrentLanguage', () => {
  it('should return the current language', () => {
    expect(getCurrentLanguage()).toBe('en');
  });

  it('should fallback to en when language is falsy', async () => {
    const i18next = (await import('i18next')).default;
    const original = i18next.language;
    (i18next as unknown as Record<string, unknown>).language = '';

    expect(getCurrentLanguage()).toBe('en');

    (i18next as unknown as Record<string, unknown>).language = original;
  });
});

describe('changeLanguage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call i18next.changeLanguage with the given language', async () => {
    await changeLanguage('fr');
    expect(mockChangeLanguage).toHaveBeenCalledWith('fr');
  });

  it('should await the changeLanguage promise', async () => {
    const promise = changeLanguage('de');
    expect(promise).toBeInstanceOf(Promise);
    await promise;
    expect(mockChangeLanguage).toHaveBeenCalledTimes(1);
  });
});

describe('getAvailableLanguages', () => {
  it('should return an array containing en', () => {
    const languages = getAvailableLanguages();
    expect(languages).toEqual(['en']);
  });

  it('should return a new array each time', () => {
    const first = getAvailableLanguages();
    const second = getAvailableLanguages();
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
  });
});

describe('formatError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should translate the error key using errors namespace', () => {
    mockT.mockImplementation((key: string, options?: Record<string, unknown>) => {
      if (key === 'connection.failed' && options?.ns === 'errors') {
        return 'Connection failed';
      }
      return key;
    });

    const result = formatError('connection.failed');
    expect(result).toBe('Connection failed');
  });

  it('should pass context to the translation', () => {
    mockT.mockImplementation((key: string, options?: Record<string, unknown>) => {
      if (key === 'upload.fileTooBig') {
        return `File exceeds ${options?.maxSize}MB`;
      }
      return key;
    });

    const result = formatError('upload.fileTooBig', { maxSize: 10 });
    expect(result).toBe('File exceeds 10MB');
  });

  it('should fallback to generic error when key returns itself', () => {
    mockT.mockImplementation((key: string, _options?: Record<string, unknown>) => {
      if (key === 'unknownError') return 'unknownError'; // key returned as-is = not found
      if (key === 'generic') return 'An error occurred';
      return key;
    });

    const result = formatError('unknownError');
    expect(result).toBe('An error occurred');
  });

  it('should return translated message when key is found', () => {
    mockT.mockImplementation((key: string) => {
      if (key === 'bot.notConnected') return 'Bot is not connected';
      return key;
    });

    const result = formatError('bot.notConnected');
    expect(result).toBe('Bot is not connected');
  });
});

describe('getCommandInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockT.mockImplementation((key: string, _options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'play.name': 'play',
        'play.description': 'Play a track',
        'pause.name': 'pause',
        'pause.description': 'Pause playback',
      };
      return translations[key] ?? key;
    });
  });

  it('should return name and description for a command', () => {
    const info = getCommandInfo('play');
    expect(info).toEqual({
      name: 'play',
      description: 'Play a track',
    });
  });

  it('should use the commands namespace for translations', () => {
    getCommandInfo('pause');
    expect(mockT).toHaveBeenCalledWith('pause.name', { ns: 'commands' });
    expect(mockT).toHaveBeenCalledWith('pause.description', { ns: 'commands' });
  });

  it('should return untranslated keys if not found', () => {
    mockT.mockImplementation((key: string) => key);
    const info = getCommandInfo('unknown');
    expect(info.name).toBe('unknown.name');
    expect(info.description).toBe('unknown.description');
  });
});

describe('hasTranslation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExists.mockImplementation((key: string) => {
      const existing = ['buttons.play', 'errors:connection.failed', 'common:buttons.play'];
      return existing.includes(key);
    });
  });

  it('should return true for existing keys without namespace', () => {
    expect(hasTranslation('buttons.play')).toBe(true);
  });

  it('should return false for non-existing keys', () => {
    expect(hasTranslation('nonexistent.key')).toBe(false);
  });

  it('should prepend namespace when provided', () => {
    expect(hasTranslation('connection.failed', 'errors')).toBe(true);
    expect(mockExists).toHaveBeenCalledWith('errors:connection.failed');
  });

  it('should return true for existing namespaced keys', () => {
    expect(hasTranslation('buttons.play', 'common')).toBe(true);
    expect(mockExists).toHaveBeenCalledWith('common:buttons.play');
  });

  it('should return false for non-existing namespaced keys', () => {
    mockExists.mockReturnValue(false);
    expect(hasTranslation('nonexistent', 'ui')).toBe(false);
  });
});
