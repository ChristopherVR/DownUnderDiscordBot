import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { expressRouter, EnhancedRouter } from '../../../helpers/expressRouter';

const mockLogger = vi.hoisted(() => ({
  error: vi.fn(),
}));

vi.mock('../../../helpers/logger', () => ({
  logger: mockLogger,
}));

type MutableRequest = Request & Record<string, unknown>;

describe('EnhancedRouter', () => {
  let router: EnhancedRouter;
  let app: express.Application;

  beforeEach(() => {
    router = expressRouter();
    app = express();
    app.use(router.getRouter());
    vi.clearAllMocks();
    mockLogger.error.mockReset();
  });

  const attachErrorHandler = () => {
    app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: message });
    });
  };

  it('wraps synchronous handlers and surfaces errors', async () => {
    router.get('/sync-error', (_req, _res) => {
      throw new Error('sync boom');
    });
    attachErrorHandler();

    const response = await request(app).get('/sync-error');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('sync boom');
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'sync boom',
        method: 'GET',
        url: '/sync-error',
      }),
      'Sync route handler error',
    );
  });

  it('wraps async handlers and captures rejections', async () => {
    router.post('/async-error', async () => {
      throw new Error('async boom');
    });
    attachErrorHandler();

    const response = await request(app).post('/async-error');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('async boom');
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'async boom',
        method: 'POST',
        url: '/async-error',
      }),
      'Async route handler error',
    );
  });

  it('allows successful handlers to respond normally', async () => {
    router.get('/ok', (_req, res) => {
      res.json({ success: true });
    });

    const response = await request(app).get('/ok');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it('supports middleware chains and respects ordering', async () => {
    router.get(
      '/middleware',
      (req, _res, next) => {
        (req as MutableRequest).middlewareStage = ['first'];
        next();
      },
      (req, res) => {
        const stages = (req as MutableRequest).middlewareStage as string[] | undefined;
        stages?.push('second');
        res.json({ stages });
      },
    );

    const response = await request(app).get('/middleware');

    expect(response.status).toBe(200);
    expect(response.body.stages).toEqual(['first', 'second']);
  });

  it('treats promise-like objects with catch as async handlers', async () => {
    router.get('/thenable', (_req, _res) => ({
      catch: (onError: (error: Error) => void) => {
        onError(new Error('thenable failure'));
      },
    }));
    attachErrorHandler();

    const response = await request(app).get('/thenable');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('thenable failure');
  });
});
