import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Api } from '../../../src/lib/api';
import { AppError } from '../../../src/lib/errorHandler';

describe('Api client', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch as unknown as typeof fetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    mockFetch.mockReset();
  });

  it('sends POST requests for player actions', async () => {
    const payload = { success: true };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => payload,
    } as Response);

    const result = await Api.play('track-123');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/player/play');
    expect(options).toMatchObject({ method: 'POST' });
    expect(result).toEqual(payload);
  });

  it('returns JSON payload for GET requests', async () => {
    const stateResponse = { guilds: {}, lastUpdated: Date.now() };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => stateResponse,
    } as Response);

    const result = await Api.getGlobalState();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/state');
    expect(result).toEqual(stateResponse);
  });

  it('throws meaningful errors on failed responses', async () => {
    mockFetch.mockRejectedValueOnce(new AppError('network failed', 'NETWORK_FAIL', undefined, false));

    await expect(Api.play('track-123')).rejects.toBeInstanceOf(AppError);
  });
});
