import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { withGuildLock, guildLockMiddleware } from '../../../src/helpers/guildLock';

/** Small deferred-promise helper for controlling task completion order in tests. */
function deferred<T>(): { promise: Promise<T>; resolve: (v: T) => void; reject: (e: unknown) => void } {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

describe('withGuildLock', () => {
  it('runs a single task and returns its result', async () => {
    const result = await withGuildLock('guild-1', async () => 42);
    expect(result).toBe(42);
  });

  it('serializes concurrent calls for the same guild - no overlap', async () => {
    const events: string[] = [];
    const first = deferred<void>();

    const taskA = withGuildLock('guild-1', async () => {
      events.push('a-start');
      await first.promise;
      events.push('a-end');
    });

    // Give taskA a tick to actually start (acquire the lock) before queuing taskB.
    await sleep(5);

    const taskB = withGuildLock('guild-1', async () => {
      events.push('b-start');
      events.push('b-end');
    });

    // taskB must not have started yet - taskA is still holding the lock.
    await sleep(5);
    expect(events).toEqual(['a-start']);

    first.resolve();
    await Promise.all([taskA, taskB]);

    expect(events).toEqual(['a-start', 'a-end', 'b-start', 'b-end']);
  });

  it('runs calls for different guilds fully concurrently', async () => {
    const events: string[] = [];
    const gate = deferred<void>();

    const taskGuild1 = withGuildLock('guild-1', async () => {
      events.push('guild1-start');
      await gate.promise;
      events.push('guild1-end');
    });

    await sleep(5);

    // A different guild must be able to start immediately, without waiting
    // on guild-1's still-pending task.
    const taskGuild2 = withGuildLock('guild-2', async () => {
      events.push('guild2-start');
      events.push('guild2-end');
    });

    await taskGuild2;
    expect(events).toEqual(['guild1-start', 'guild2-start', 'guild2-end']);

    gate.resolve();
    await taskGuild1;
    expect(events).toEqual(['guild1-start', 'guild2-start', 'guild2-end', 'guild1-end']);
  });

  it('propagates the task result and re-throws its rejection', async () => {
    await expect(
      withGuildLock('guild-1', async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
  });

  it('a rejected task does not poison the chain for subsequent callers', async () => {
    const events: string[] = [];

    await expect(
      withGuildLock('guild-1', async () => {
        events.push('first');
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    const result = await withGuildLock('guild-1', async () => {
      events.push('second');
      return 'ok';
    });

    expect(result).toBe('ok');
    expect(events).toEqual(['first', 'second']);
  });

  it('runs many queued calls for the same guild in strict order', async () => {
    const order: number[] = [];
    const tasks = Array.from({ length: 10 }, (_, i) =>
      withGuildLock('guild-order', async () => {
        // Yield to the event loop so out-of-order execution would actually surface.
        await sleep(Math.random() * 5);
        order.push(i);
      }),
    );

    await Promise.all(tasks);
    expect(order).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});

describe('guildLockMiddleware', () => {
  function buildApp(handler: (req: Request, res: Response) => void) {
    const app = express();
    app.use(express.json());
    app.use(guildLockMiddleware);
    app.all(['/test', '/test/:guildId'], handler);
    return app;
  }

  it('calls next() immediately when no guildId can be resolved', async () => {
    const handler = vi.fn((_req: Request, res: Response) => res.status(200).json({ ok: true }));
    const app = buildApp(handler);

    const res = await request(app).post('/test').send({});
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('extracts guildId from x-guild-id header and still completes the request', async () => {
    const handler = vi.fn((_req: Request, res: Response) => res.status(200).json({ ok: true }));
    const app = buildApp(handler);

    const res = await request(app).post('/test').set('x-guild-id', 'guild-abc').send({});
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('extracts guildId from query, body, and params when header is absent', async () => {
    const handler = vi.fn((_req: Request, res: Response) => res.status(200).json({ ok: true }));
    const app = buildApp(handler);

    const byQuery = await request(app).post('/test?guildId=guild-q').send({});
    expect(byQuery.status).toBe(200);

    const byBody = await request(app).post('/test').send({ guildId: 'guild-b' });
    expect(byBody.status).toBe(200);

    const byParams = await request(app).post('/test/guild-p').send({});
    expect(byParams.status).toBe(200);

    expect(handler).toHaveBeenCalledTimes(3);
  });

  it('serializes two requests for the same guild so handler bodies do not overlap', async () => {
    const events: string[] = [];
    const gate = deferred<void>();
    const req1Started = deferred<void>();
    let first = true;

    const handler = vi.fn(async (_req: Request, res: Response) => {
      if (first) {
        first = false;
        events.push('req1-start');
        req1Started.resolve();
        await gate.promise;
        events.push('req1-end');
        res.status(200).json({ ok: true });
        return;
      }
      events.push('req2-start');
      res.status(200).json({ ok: true });
    });

    const app = buildApp(handler as unknown as (req: Request, res: Response) => void);

    // supertest/superagent requests are lazy - the HTTP call isn't actually
    // dispatched until something awaits/`.then()`s the Test object. Kick each
    // one off immediately via `.then()` instead of just holding a reference.
    const req1 = request(app).post('/test').set('x-guild-id', 'same-guild').send({});
    const req1Promise = req1.then((res) => res);
    await req1Started.promise;

    const req2 = request(app).post('/test').set('x-guild-id', 'same-guild').send({});
    const req2Promise = req2.then((res) => res);
    // Give req2 time to actually reach the server and attempt to acquire the
    // (still-held) lock before we let req1 finish - otherwise this wouldn't
    // exercise contention at all.
    await sleep(200);

    gate.resolve();
    const [res1, res2] = await Promise.all([req1Promise, req2Promise]);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    // If the lock didn't serialize these, req2-start could appear before req1-end.
    expect(events).toEqual(['req1-start', 'req1-end', 'req2-start']);
  });

  it('releases the lock even if the handler throws (via close/finish)', async () => {
    const events: string[] = [];

    const app = express();
    app.use(guildLockMiddleware);
    app.get('/boom', () => {
      throw new Error('handler exploded');
    });
    app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
      events.push('error-handled');
      res.status(500).json({ error: (err as Error).message });
    });

    const res1 = await request(app).get('/boom').set('x-guild-id', 'guild-err');
    expect(res1.status).toBe(500);

    // The lock must have been released - a second request for the same guild
    // should not hang.
    const res2 = await request(app).get('/boom').set('x-guild-id', 'guild-err');
    expect(res2.status).toBe(500);
    expect(events).toEqual(['error-handled', 'error-handled']);
  });
});
