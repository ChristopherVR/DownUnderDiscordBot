import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Serializes operations per guildId.
 *
 * discord-player accepts concurrent `queue.play(...)` and queue mutations
 * without explicit coordination — two rapid POSTs to `/api/music/play` for
 * the same guild can interleave and produce duplicate adds or out-of-order
 * track loads. This helper forces one-at-a-time execution *per guild* while
 * leaving cross-guild calls fully concurrent.
 *
 * The lock is a chained promise queue: each caller waits on the previous
 * lock's promise, then runs. Rejections don't poison the chain.
 */
const guildLocks = new Map<string, Promise<void>>();

export async function withGuildLock<T>(guildId: string, fn: () => Promise<T>): Promise<T> {
  const prev = guildLocks.get(guildId) ?? Promise.resolve();

  let release!: () => void;
  const next = new Promise<void>((resolve) => {
    release = resolve;
  });
  guildLocks.set(guildId, next);

  try {
    await prev;
    return await fn();
  } finally {
    // If we're still the tail, clear the slot so the map doesn't grow.
    if (guildLocks.get(guildId) === next) {
      guildLocks.delete(guildId);
    }
    release();
  }
}

/**
 * Express middleware that wraps downstream handlers in `withGuildLock`.
 * Expects `requireGuildAccess` (or equivalent) to have run first so the
 * guildId is resolvable from header / body / query / params. If no guildId
 * is present, the request proceeds without locking.
 */
export const guildLockMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const guildId =
    (typeof req.headers['x-guild-id'] === 'string' && req.headers['x-guild-id']) ||
    (typeof req.query.guildId === 'string' && req.query.guildId) ||
    (req.body && typeof req.body === 'object' && typeof req.body.guildId === 'string' && req.body.guildId) ||
    (typeof req.params?.guildId === 'string' && req.params.guildId) ||
    null;

  if (!guildId) {
    next();
    return;
  }

  void withGuildLock(guildId, async () => {
    // Resolve once the response finishes so the next caller can proceed.
    await new Promise<void>((resolve) => {
      res.once('finish', resolve);
      res.once('close', resolve);
      next();
    });
  });
};
