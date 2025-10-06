import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { expressRouter } from '../../helpers/expressRouter';

const mockLogger = vi.hoisted(() => ({
  error: vi.fn(),
}));

vi.mock('../../helpers/logger', () => ({
  logger: mockLogger,
}));

type MutableRequest = Request & Record<string, unknown>;

describe('ExpressRouter integration', () => {
  let app: express.Application;

  beforeEach(() => {
    mockLogger.error.mockReset();
    app = express();
  });

  const withErrorBoundary = (instance: express.Application) => {
    instance.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
      });
    });
  };

  it('orchestrates mixed sync and async middleware', async () => {
    const router = expressRouter();
    router.get(
      '/pipeline',
      (req, _res, next) => {
        (req as MutableRequest).stages = ['setup'];
        next();
      },
      async (req, _res, next) => {
        const stages = (req as MutableRequest).stages as string[] | undefined;
        stages?.push('async');
        await Promise.resolve();
        next();
      },
      (req, res) => {
        const stages = (req as MutableRequest).stages as string[] | undefined;
        stages?.push('final');
        res.json({ stages });
      },
    );

    app.use(router.getRouter());

    const response = await request(app).get('/pipeline');
    expect(response.status).toBe(200);
    expect(response.body.stages).toEqual(['setup', 'async', 'final']);
  });

  it('bubbles errors thrown mid-chain to the error handler', async () => {
    const router = expressRouter();
    router.post(
      '/failure',
      (req, _res, next) => {
        (req as MutableRequest).touched = true;
        next();
      },
      async () => {
        throw new Error('middleware failure');
      },
      (_req, res) => {
        res.json({ unreachable: true });
      },
    );

    app.use(router.getRouter());
    withErrorBoundary(app);

    const response = await request(app).post('/failure');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('middleware failure');
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'middleware failure', method: 'POST', url: '/failure' }),
      'Async route handler error',
    );
  });

  it('supports handlers that return promises created by transpiled code', async () => {
    const router = expressRouter();
    const transpiledStyleHandler = function (_req: Request, res: Response) {
      return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          try {
            res.json({ type: 'transpiled' });
            resolve();
          } catch (error) {
            reject(error as Error);
          }
        }, 5);
      });
    };

    router.get('/transpiled', transpiledStyleHandler);

    app.use(router.getRouter());
    withErrorBoundary(app);

    const response = await request(app).get('/transpiled');
    expect(response.status).toBe(200);
    expect(response.body.type).toBe('transpiled');
  });
});
