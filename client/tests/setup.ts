/* eslint-env browser */

import '@testing-library/jest-dom';
import { vi } from 'vitest';
import type { ReactNode } from 'react';

type MatchMediaMock = {
  matches: boolean;
  media: string;
  onchange: null;
  addListener: (...args: unknown[]) => void;
  removeListener: (...args: unknown[]) => void;
  addEventListener: (...args: unknown[]) => void;
  removeEventListener: (...args: unknown[]) => void;
  dispatchEvent: (...args: unknown[]) => boolean;
};

type GlobalTestScope = typeof globalThis & {
  WebSocket: typeof WebSocket;
  ResizeObserver: unknown;
  IntersectionObserver: unknown;
  matchMedia?: (query: string) => MatchMediaMock;
};

const globalScope = globalThis as GlobalTestScope;

// Mock WebSocket
globalScope.WebSocket = vi.fn(() => ({
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  send: vi.fn(),
  close: vi.fn(),
  readyState: WebSocket.OPEN,
})) as unknown as typeof WebSocket;

// Mock ResizeObserver
globalScope.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin = '0px';
  readonly thresholds: ReadonlyArray<number> = [];
  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {
    this.callback = callback;
  }

  observe: IntersectionObserver['observe'] = vi.fn();
  unobserve: IntersectionObserver['unobserve'] = vi.fn();
  disconnect: IntersectionObserver['disconnect'] = vi.fn();
  takeRecords: IntersectionObserver['takeRecords'] = vi.fn(() => []);

  trigger(entries: IntersectionObserverEntry[] = []) {
    this.callback(entries, this);
  }
}

globalScope.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock matchMedia
Object.defineProperty(globalScope, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock HTMLElement methods
if (typeof globalScope.HTMLElement !== 'undefined') {
  Object.defineProperty(globalScope.HTMLElement.prototype, 'scrollIntoView', {
    value: vi.fn(),
    writable: true,
  });
}

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, string>) => {
      const translations: Record<string, string> = {
        'ui.dashboard': 'Dashboard',
        'ui.musicPlayer': 'Music Player',
        'ui.commandInvocation': 'Command Invocation',
        'ui.auditLogs': 'Audit Logs',
        'ui.botManagement': 'Bot Management',
        'ui.play': 'Play',
        'ui.pause': 'Pause',
        'ui.stop': 'Stop',
        'ui.next': 'Next',
        'ui.previous': 'Previous',
        'ui.volume': 'Volume',
        'ui.search': 'Search',
        'ui.upload': 'Upload',
        'ui.execute': 'Execute',
        'ui.history': 'History',
        'ui.online': 'Online',
        'ui.offline': 'Offline',
        'ui.connected': 'Connected',
        'ui.disconnected': 'Disconnected',
        'errors.generic': 'An error occurred',
        'errors.connection.failed': 'Connection failed',
        'errors.command.invalid': 'Invalid command',
        'errors.upload.fileTooBig': 'File too large',
        'errors.player.trackNotFound': 'Track not found',
      };

      let result = translations[key] || key;

      if (options && typeof result === 'string') {
        Object.keys(options).forEach((optionKey) => {
          const pattern = new RegExp('{{' + optionKey + '}}', 'g');
          result = result.replace(pattern, options[optionKey]);
        });
      }

      return result;
    },
    i18n: {
      changeLanguage: vi.fn(),
      language: 'en',
    },
  }),
  Trans: ({ children }: { children: ReactNode }) => children,
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

// Mock i18next-http-backend
vi.mock('i18next-http-backend', () => ({
  default: {
    type: 'backend',
    init: vi.fn(),
    read: vi.fn(),
    readMulti: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
  },
}));

// Mock zustand stores
vi.mock('@/stores/useBotStore', () => {
  const storeState = {
    bots: [],
    activeBotId: null,
    connectionStatus: 'disconnected',
    setBots: vi.fn(),
    setActiveBotId: vi.fn(),
    setConnectionStatus: vi.fn(),
    setWebSocketStatus: vi.fn(),
    setPlayer: vi.fn(),
    pushLog: vi.fn(),
    addCommandExecution: vi.fn(),
    setConnections: vi.fn(),
    setStatus: vi.fn(),
    status: { connected: false, serverName: 'Discord Bot', channelName: '' },
  };

  const useBotStoreFn = vi.fn((selector?: (state: typeof storeState) => unknown) =>
    selector ? selector(storeState) : storeState,
  );

  const useBotStore = useBotStoreFn as unknown as {
    (selector?: (state: typeof storeState) => unknown): typeof storeState;
    getState: () => typeof storeState;
  };

  useBotStore.getState = () => storeState;

  return { useBotStore };
});
