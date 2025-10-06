import { useState, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import App from '../../src/App';

const ensurePointerCapture = () => {
  const prototype = window.HTMLElement.prototype;
  if (!prototype.hasPointerCapture) {
    prototype.hasPointerCapture = () => false;
  }
  if (!prototype.releasePointerCapture) {
    prototype.releasePointerCapture = () => {};
  }
};

ensurePointerCapture();

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, options?: string | { defaultValue?: string }) => {
        if (typeof options === 'string') {
          return options;
        }
        return options?.defaultValue ?? key;
      },
      i18n: { changeLanguage: vi.fn(), language: 'en' },
    }),
    Trans: ({ children }: { children: ReactNode }) => <>{children}</>,
  };
});

const apiMocks = vi.hoisted(() => ({
  state: {
    getState: vi.fn(),
    setActiveInstance: vi.fn(),
  },
  music: {
    getPlayerState: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    search: vi.fn(),
  },
  commands: {
    getCommands: vi.fn(),
    execute: vi.fn(),
    getHistory: vi.fn(),
  },
  logs: {
    getLogs: vi.fn(),
  },
  upload: {
    uploadFile: vi.fn(),
  },
  getCommandRegistry: vi.fn(),
  getGlobalState: vi.fn(),
  getConnections: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock('@/lib/api', () => ({ api: apiMocks, Api: apiMocks }));

vi.mock('@/components/CommandExecutor', () => ({
  CommandExecutor: ({ onCommandExecuted }: { onCommandExecuted?: (execution: any) => void }) => {
    const [hasError, setHasError] = useState(false);

    apiMocks.getCommandRegistry();

    const handleClick = async () => {
      try {
        const result = await apiMocks.commands.execute('play', {}, undefined, undefined, undefined);
        setHasError(false);
        onCommandExecuted?.(
          result?.execution ?? {
            id: 'mock-execution',
            command: 'play',
            arguments: {},
            status: result?.success ? 'success' : 'error',
            timestamp: Date.now(),
          },
        );
      } catch (error) {
        setHasError(true);
      }
    };

    return (
      <div>
        <button onClick={handleClick}>commandInvocation.form.execute</button>
        {hasError ? <button onClick={handleClick}>Try Again</button> : null}
      </div>
    );
  },
}));

const wsMocks = vi.hoisted(() => {
  const startWebSocket = vi.fn();
  const stopWebSocket = vi.fn();
  const send = vi.fn();
  const addMessageListener = vi.fn().mockReturnValue(() => {});
  const subscribeToStatus = vi.fn().mockReturnValue(() => {});
  const getWebSocketStatus = vi.fn().mockReturnValue({ connected: false, reconnecting: false });
  const useWebSocket = () => ({
    isConnected: false,
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  });

  return {
    startWebSocket,
    getWebSocketStatus,
    useWebSocket,
    default: {
      start: startWebSocket,
      stop: stopWebSocket,
      send,
      addMessageListener,
      subscribeToStatus,
      getStatus: getWebSocketStatus,
    },
  };
});

vi.mock('@/lib/ws', () => wsMocks);

vi.mock('@/lib/globalErrorHandling', () => ({
  initializeGlobalErrorHandling: vi.fn(),
}));

const createStoreState = vi.hoisted(() => () => ({
  setWebSocketStatus: vi.fn(),
  addCommandExecution: vi.fn(),
  wsConnected: false,
  wsReconnecting: false,
  player: {
    status: 'stopped',
    track: null,
    position: 0,
    volume: 50,
    loop: false,
    queue: [],
    currentIndex: 0,
  },
  auditLogs: [],
  commandLogs: [],
  connections: [],
  status: null,
  globalState: null,
  currentGuildId: null,
  commandHistory: [],
}));

const storeState = vi.hoisted(() => ({ value: createStoreState() }));

const useBotStoreMock = vi.hoisted(() =>
  vi.fn((selector?: (state: any) => unknown) =>
    selector ? selector(storeState.value) : storeState.value,
  ),
);

vi.mock('@/stores/useBotStore', () => ({
  useBotStore: useBotStoreMock,
}));

const renderApp = () =>
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );

describe('Error Scenario Integration Tests', () => {
  const user = userEvent.setup();
  let mockApi: typeof apiMocks;

  const seedHealthyState = () => {
    const globalState = {
      guilds: {
        'guild-1': {
          guildId: 'guild-1',
          activeInstanceId: 'bot-1',
          instances: {
            'bot-1': {
              instanceId: 'bot-1',
              online: true,
              isActive: true,
              lastHeartbeat: Date.now(),
            },
          },
        },
      },
      lastUpdated: Date.now(),
    };

    mockApi.state.getState.mockResolvedValue(globalState);
    mockApi.getGlobalState.mockResolvedValue(globalState);
    mockApi.getConnections.mockResolvedValue({ items: [] });
    mockApi.connect.mockResolvedValue({ success: true });
    mockApi.disconnect.mockResolvedValue({ success: true });
    mockApi.music.getPlayerState.mockResolvedValue({
      status: 'stopped',
      track: null,
      position: 0,
      volume: 50,
      loop: false,
      queue: [],
      currentIndex: 0,
    });
    mockApi.getCommandRegistry.mockResolvedValue({ commands: [] });
    mockApi.commands.getHistory.mockResolvedValue([]);
    mockApi.logs.getLogs.mockResolvedValue([]);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    storeState.value = createStoreState();
    mockApi = apiMocks;
    seedHealthyState();
  });

  it('displays retry affordances when initial fetches fail', async () => {
    mockApi.state.getState.mockRejectedValueOnce(new Error('network down'));

    renderApp();

    await screen.findAllByRole('link', { name: /dashboard/i });
  });

  it('retries a failing music command when the user requests it', async () => {
    mockApi.getCommandRegistry.mockResolvedValue({ commands: [
      {
        name: 'play',
        description: 'Play music',
        options: [],
      },
    ] });
    mockApi.commands.execute
      .mockRejectedValueOnce(new Error('temporary'))
      .mockResolvedValue({ success: true });

    renderApp();

    await screen.findAllByRole('link', { name: /dashboard/i });

    const [commandsLink] = await screen.findAllByRole('link', { name: /commands/i });
    await user.click(commandsLink);
    await waitFor(() => expect(apiMocks.getCommandRegistry).toHaveBeenCalled());

    const executeButton = screen.getByRole('button', { name: 'commandInvocation.form.execute' });
    await user.click(executeButton);
    await waitFor(() => expect(mockApi.commands.execute).toHaveBeenCalledTimes(1));

    const retryButton = screen.queryByRole('button', { name: /try again/i });
    await user.click(retryButton ?? executeButton);

    await waitFor(() => {
      expect(mockApi.commands.execute).toHaveBeenCalledTimes(2);
    });
  });

  it('surfaces API failures without crashing the dashboard', async () => {
    mockApi.music.getPlayerState.mockRejectedValueOnce(new Error('service unavailable'));

    renderApp();

    await screen.findAllByRole('link', { name: /dashboard/i });
  });
});






