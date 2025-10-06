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

type ExpressHandler = (req: Request, res: Response, next: NextFunction) => unknown;

describe('ExpressRouter production edge cases', () => {
  let app: express.Application;

  beforeEach(() => {
    mockLogger.error.mockReset();
    app = express();
  });

  const mountRouter = () => {
    const router = expressRouter();
    app.use(router.getRouter());
    return router;
  };

  it('handles handlers with mangled names produced by minifiers', async () => {
    const router = mountRouter();

    const a: ExpressHandler = async (_req, res) => {
      res.json({ handler: 'a' });
    };

    const b: ExpressHandler = (_req, res) =>
      new Promise<void>((resolve) => {
        setTimeout(() => {
          res.json({ handler: 'b' });
          resolve();
        }, 5);
      });

    const c: ExpressHandler = async (_req, res) => {
      res.json({ handler: 'c' });
    };
    Object.defineProperty(c, 'name', { value: 'c' });

    router.get('/a', a);
    router.get('/b', b);
    router.get('/c', c);

    const [resA, resB, resC] = await Promise.all([
      request(app).get('/a'),
      request(app).get('/b'),
      request(app).get('/c'),
    ]);

    expect(resA.body.handler).toBe('a');
    expect(resB.body.handler).toBe('b');
    expect(resC.body.handler).toBe('c');
  });

  it('supports handlers with modified prototypes or constructor metadata', async () => {
    const router = mountRouter();

    const handler: ExpressHandler = async (_req, res) => {
      res.json({ type: 'altered' });
    };

    Object.setPrototypeOf(handler, {});
    Object.defineProperty(handler.constructor, 'name', { value: '' });
    handler.toString = () => 'function(){/*native*/}';

    router.get('/altered', handler);

    const response = await request(app).get('/altered');
    expect(response.status).toBe(200);
    expect(response.body.type).toBe('altered');
  });

  it('works with decorator style wrappers without using the Function type', async () => {
    const router = mountRouter();

    interface UserPayload {
      id: number;
      role: 'admin' | 'user';
    }

    const withAuth = (handler: ExpressHandler): ExpressHandler => {
      return async (req, res, next) => {
        if (!req.headers.authorization) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }
        (req as Request & { user?: UserPayload }).user = { id: 1, role: 'admin' };
        await Promise.resolve(handler(req, res, next));
      };
    };

    const withLogging = (handler: ExpressHandler): ExpressHandler => {
      return (req, res, next) => {
        const start = Date.now();
        const originalJson = res.json.bind(res);
        res.json = (body: unknown) => {
          if (typeof body === 'object' && body !== null) {
            Object.assign(body as Record<string, unknown>, { duration: Date.now() - start });
          }
          return originalJson(body);
        };
        return handler(req, res, next);
      };
    };

    const baseHandler: ExpressHandler = async (req, res) => {
      res.json({ message: 'decorated', user: (req as Request & { user?: UserPayload }).user });
    };

    router.get('/decorated', withAuth(withLogging(baseHandler)));

    const unauthorized = await request(app).get('/decorated');
    expect(unauthorized.status).toBe(401);

    const authorized = await request(app).get('/decorated').set('Authorization', 'Bearer token');
    expect(authorized.status).toBe(200);
    expect(authorized.body.message).toBe('decorated');
    expect(authorized.body.user).toEqual({ id: 1, role: 'admin' });
    expect(typeof authorized.body.duration).toBe('number');
  });
});
