import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useWebSocket } from '../../../src/lib/ws';
import type { WebSocketMessage } from 'discord-dashboard-shared';

type EventLike = { type: string };
type MessageEventLike = { type: string; data: string };

type MockMessage = Extract<WebSocketMessage, { payload: unknown }>;

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static currentInstance: MockWebSocket | null = null;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: EventLike) => void) | null = null;
  onclose: ((event: EventLike) => void) | null = null;
  onmessage: ((event: MessageEventLike) => void) | null = null;
  onerror: ((event: EventLike) => void) | null = null;

  constructor(public url: string, public protocols?: string | string[]) {
    MockWebSocket.currentInstance = this;
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.({ type: 'open' });
    }, 5);
  }

  send: WebSocket['send'] = vi.fn();

  close: WebSocket['close'] = vi.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ type: 'close' });
  });

  simulateMessage(message: MockMessage) {
    this.onmessage?.({ type: 'message', data: JSON.stringify(message) });
  }

  simulateError() {
    this.onerror?.({ type: 'error' });
  }
}

const nativeWebSocket = globalThis.WebSocket;

describe('useWebSocket', () => {
  const getSocket = () => MockWebSocket.currentInstance;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    MockWebSocket.currentInstance = null;
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
  });

  afterEach(() => {
    const socket = getSocket();
    if (socket) {
      act(() => {
        socket.close();
      });
    }
    MockWebSocket.currentInstance = null;
    globalThis.WebSocket = nativeWebSocket;
    vi.useRealTimers();
  });

  it('reports connection status changes', () => {
    const { result } = renderHook(() => useWebSocket());
    expect(result.current.isConnected).toBe(false);

    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(result.current.isConnected).toBe(true);

    act(() => {
      getSocket()?.close();
    });

    expect(result.current.isConnected).toBe(false);
  });

  it('delivers messages to subscribers', () => {
    const { result } = renderHook(() => useWebSocket());
    const handler = vi.fn();

    act(() => {
      vi.advanceTimersByTime(10);
    });

    act(() => {
      result.current.subscribe('player_state', handler);
    });

    act(() => {
      getSocket()?.simulateMessage({
        type: 'player_state',
        payload: { status: 'playing' },
      } as MockMessage);
    });

    expect(handler).toHaveBeenCalledWith({ status: 'playing' });

    act(() => {
      result.current.unsubscribe('player_state');
    });

    act(() => {
      getSocket()?.simulateMessage({
        type: 'player_state',
        payload: { status: 'paused' },
      } as MockMessage);
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('ignores messages before subscription', () => {
    const { result } = renderHook(() => useWebSocket());
    const handler = vi.fn();

    act(() => {
      vi.advanceTimersByTime(10);
    });

    act(() => {
      getSocket()?.simulateMessage({
        type: 'player_state',
        payload: { status: 'paused', currentIndex: 0, loop: false, position: 0, queue: [], track: null, volume: 50 },
      } as MockMessage);
    });

    act(() => {
      result.current.subscribe('player_state', handler);
      getSocket()?.simulateMessage({
        type: 'player_state',
        payload: { status: 'playing' },
      } as MockMessage);
    });

    expect(handler).toHaveBeenCalledWith({ status: 'playing' });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
