import path from 'path';
import { promises as fs, realpathSync } from 'fs';
import type { Request, Response, NextFunction } from 'express';
import { createLogger } from './logger.js';
import type { AuthedRequest } from '../routes/auth.js';

const log = createLogger('library-roots');

/** Comma-separated allowlist of absolute path prefixes. Any endpoint that reads
 *  an arbitrary filesystem path supplied by a client must resolve inside one
 *  of these. Falls back to MUSIC_FOLDER_PATH when unset. If neither is
 *  configured, every path is rejected - filesystem access must be explicitly
 *  opted into, never open by default. */
const configuredRoots = (process.env.LIBRARY_ROOTS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
if (configuredRoots.length === 0 && process.env.MUSIC_FOLDER_PATH) {
  configuredRoots.push(process.env.MUSIC_FOLDER_PATH);
}
// Resolve symlinks in the roots themselves too, so a symlinked root can't be
// used to redefine the allowlist to something broader than intended.
export const LIBRARY_ROOTS: string[] = configuredRoots.flatMap((p) => {
  try {
    return [realpathSync(path.resolve(p))];
  } catch (err) {
    log.warn({ err, path: p }, 'LIBRARY_ROOTS entry does not exist on disk; ignoring it');
    return [];
  }
});

if (LIBRARY_ROOTS.length === 0) {
  log.warn('LIBRARY_ROOTS (and MUSIC_FOLDER_PATH) are unset; all filesystem-path requests will be rejected.');
}

/** Resolves symlinks before comparing so a symlink inside an allowed root
 *  can't be used to escape it. Returns false (disallowed) if the path doesn't
 *  exist yet or can't be resolved. */
export async function pathIsAllowed(targetPath: string): Promise<boolean> {
  if (LIBRARY_ROOTS.length === 0) return false;
  let real: string;
  try {
    real = await fs.realpath(targetPath);
  } catch {
    return false;
  }
  return LIBRARY_ROOTS.some((root) => real === root || real.startsWith(root + path.sep));
}

/** Comma-separated Discord user IDs allowed to touch filesystem-path
 *  endpoints, in addition to the trusted quick-connect ('local') identity.
 *  Filesystem paths are sensitive - this is operator-only by design, not
 *  open to every authenticated Discord user. */
const LIBRARY_ALLOWED_USERS = new Set(
  (process.env.LIBRARY_ALLOWED_USERS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);

/** Express middleware gating any route that reads a client-supplied
 *  filesystem path (library scans, local-folder streaming, etc.) to the
 *  trusted local identity or an explicitly allowlisted user. */
export function requireLibraryOperator(req: Request, res: Response, next: NextFunction): void {
  const auth = (req as AuthedRequest).auth;
  if (auth?.userId === 'local' || (auth?.userId && LIBRARY_ALLOWED_USERS.has(auth.userId))) {
    next();
    return;
  }
  res.status(403).json({ error: 'Not authorized to access the filesystem library' });
}
