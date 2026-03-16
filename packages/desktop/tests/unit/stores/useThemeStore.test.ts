import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock localStorage before the store is imported (it runs loadFromStorage() at module level)
const localStorageMap = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => localStorageMap.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => localStorageMap.set(key, value)),
  removeItem: vi.fn((key: string) => localStorageMap.delete(key)),
  clear: vi.fn(() => localStorageMap.clear()),
  get length() {
    return localStorageMap.size;
  },
  key: vi.fn(() => null),
};

// Mock document.documentElement for applyToDOM
const mockDocEl = {
  setAttribute: vi.fn(),
  getAttribute: vi.fn(),
};

// Mock window.matchMedia for system theme detection
const mockMatchMedia = vi.fn().mockReturnValue({
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
});

vi.stubGlobal('localStorage', localStorageMock);
vi.stubGlobal('document', { documentElement: mockDocEl });
vi.stubGlobal('window', { matchMedia: mockMatchMedia });

// Import store after mocks are set up
const { useThemeStore, ACCENT_THEMES } = await import('@/stores/useThemeStore');

describe('useThemeStore', () => {
  beforeEach(() => {
    localStorageMap.clear();
    vi.clearAllMocks();

    // Reset store to defaults
    useThemeStore.setState({
      mode: 'dark',
      accent: 'green',
      resolvedMode: 'dark',
    });
  });

  describe('initial state', () => {
    it('has default mode of dark', () => {
      expect(useThemeStore.getState().mode).toBe('dark');
    });

    it('has default accent of green', () => {
      expect(useThemeStore.getState().accent).toBe('green');
    });

    it('has resolvedMode matching mode when mode is not system', () => {
      expect(useThemeStore.getState().resolvedMode).toBe('dark');
    });
  });

  describe('setMode', () => {
    it('sets mode to light', () => {
      useThemeStore.getState().setMode('light');
      const state = useThemeStore.getState();
      expect(state.mode).toBe('light');
      expect(state.resolvedMode).toBe('light');
    });

    it('sets mode to dark', () => {
      useThemeStore.getState().setMode('light');
      useThemeStore.getState().setMode('dark');
      const state = useThemeStore.getState();
      expect(state.mode).toBe('dark');
      expect(state.resolvedMode).toBe('dark');
    });

    it('sets mode to system and resolves based on system preference', () => {
      // matchMedia returns matches=false for prefers-color-scheme: light
      // so getSystemPreference() returns 'dark'
      mockMatchMedia.mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
      useThemeStore.getState().setMode('system');
      const state = useThemeStore.getState();
      expect(state.mode).toBe('system');
      expect(state.resolvedMode).toBe('dark');
    });

    it('persists mode to localStorage', () => {
      useThemeStore.getState().setMode('light');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('du-theme', expect.stringContaining('"mode":"light"'));
    });

    it('applies mode to DOM', () => {
      useThemeStore.getState().setMode('light');
      expect(mockDocEl.setAttribute).toHaveBeenCalledWith('data-mode', 'light');
    });
  });

  describe('setAccent', () => {
    it('changes accent color', () => {
      useThemeStore.getState().setAccent('purple');
      expect(useThemeStore.getState().accent).toBe('purple');
    });

    it('persists accent to localStorage', () => {
      useThemeStore.getState().setAccent('blue');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('du-theme', expect.stringContaining('"accent":"blue"'));
    });

    it('applies accent to DOM', () => {
      useThemeStore.getState().setAccent('rose');
      expect(mockDocEl.setAttribute).toHaveBeenCalledWith('data-accent', 'rose');
    });

    it('accepts all valid accent colors', () => {
      const accents = ['green', 'purple', 'blue', 'rose', 'orange', 'cyan'] as const;
      for (const accent of accents) {
        useThemeStore.getState().setAccent(accent);
        expect(useThemeStore.getState().accent).toBe(accent);
      }
    });
  });

  describe('initSystemListener', () => {
    it('registers a change event listener on matchMedia', () => {
      const addEventListenerMock = vi.fn();
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: addEventListenerMock,
        removeEventListener: vi.fn(),
      });

      useThemeStore.getState().initSystemListener();
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
      expect(addEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });

  describe('ACCENT_THEMES', () => {
    it('has exactly 6 theme definitions', () => {
      expect(ACCENT_THEMES).toHaveLength(6);
    });

    it('each theme has id, label, color, colorHover, colorLight', () => {
      for (const theme of ACCENT_THEMES) {
        expect(theme).toHaveProperty('id');
        expect(theme).toHaveProperty('label');
        expect(theme).toHaveProperty('color');
        expect(theme).toHaveProperty('colorHover');
        expect(theme).toHaveProperty('colorLight');
      }
    });

    it('theme ids match AccentColor type values', () => {
      const ids = ACCENT_THEMES.map((t) => t.id);
      expect(ids).toEqual(['green', 'purple', 'blue', 'rose', 'orange', 'cyan']);
    });
  });
});
