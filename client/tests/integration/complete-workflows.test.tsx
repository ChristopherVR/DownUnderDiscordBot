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
    search: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
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
  const getWebSocketStatus = vi.fn().mockReturnValue({ connected: true, reconnecting: false });
  const useWebSocket = () => ({
    isConnected: true,
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
  wsConnected: true,
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

const defaultState = {
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

const renderApp = () =>
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );

describe('Complete Dashboard Workflows', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    storeState.value = createStoreState();
    apiMocks.state.getState.mockResolvedValue(defaultState);
    apiMocks.getGlobalState.mockResolvedValue(defaultState);
    apiMocks.getConnections.mockResolvedValue({ items: [] });
    apiMocks.connect.mockResolvedValue({ success: true });
    apiMocks.disconnect.mockResolvedValue({ success: true });
    apiMocks.music.getPlayerState.mockResolvedValue({
      status: 'stopped',
      track: null,
      position: 0,
      volume: 50,
      loop: false,
      queue: [],
      currentIndex: 0,
    });
    apiMocks.getCommandRegistry.mockResolvedValue({ commands: [
      {
        name: 'play',
        description: 'Play music',
        options: [],
      },
    ] });
    apiMocks.commands.getHistory.mockResolvedValue([]);
    apiMocks.logs.getLogs.mockResolvedValue([]);
  });

  it('initializes global services and renders primary layout', async () => {
    renderApp();

    await screen.findAllByRole('link', { name: /dashboard/i });

    await waitFor(() => {
      expect(wsMocks.startWebSocket).toHaveBeenCalled();
      expect(apiMocks.getGlobalState).toHaveBeenCalled();
    });
    expect(screen.getAllByRole('link', { name: /dashboard/i })).not.toHaveLength(0);
  });

  it('allows navigating between dashboard, music, and commands sections', async () => {
    renderApp();

    await screen.findAllByRole('link', { name: /dashboard/i });

    const [musicLink] = await screen.findAllByRole('link', { name: /music player/i });
    await user.click(musicLink);
    const musicHeading = await screen.findByRole('heading', { name: 'musicPlayer.title', level: 1 });
    expect(musicHeading).toBeInTheDocument();

    const [commandsLink] = await screen.findAllByRole('link', { name: /commands/i });
    await user.click(commandsLink);
    await waitFor(() => {
      expect(apiMocks.getCommandRegistry).toHaveBeenCalled();
    });
    const commandInvocationLabels = await screen.findAllByText('commandInvocation.executeCommand');
    expect(commandInvocationLabels.length).toBeGreaterThan(0);
  });

  it('surfaces command execution feedback', async () => {
    apiMocks.commands.execute.mockResolvedValue({
      success: true,
      execution: {
        id: 'exec-1',
        command: 'play',
        arguments: {},
        status: 'success',
        timestamp: Date.now(),
      },
    });

    renderApp();

    await screen.findAllByRole('link', { name: /dashboard/i });

    const [commandsLink] = await screen.findAllByRole('link', { name: /commands/i });
    await user.click(commandsLink);
    const commandFormLabels = await screen.findAllByText('commandInvocation.executeCommand');
    expect(commandFormLabels.length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'commandInvocation.form.execute' }));

    await waitFor(() => {
      expect(apiMocks.commands.execute).toHaveBeenCalled();
    });
  });
});










