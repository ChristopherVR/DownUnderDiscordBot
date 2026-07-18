import { Request, Response, NextFunction, Router } from 'express';
import type { Router as RouterType } from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import { LocalMusicService, type LocalTrack } from '../services/LocalMusicService.js';
import { createLogger } from '../helpers/logger.js';
import type { AuthedRequest } from './auth.js';

const log = createLogger('library');
const router: RouterType = Router();

const localMusicService = new LocalMusicService();

/** Comma-separated allowlist of absolute path prefixes. Web-mode library scans
 *  must resolve inside one of these. Falls back to MUSIC_FOLDER_PATH when unset.
 *  If neither is configured, every scan is rejected — filesystem access must be
 *  explicitly opted into, never open by default. */
const configuredRoots = (process.env.LIBRARY_ROOTS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
if (configuredRoots.length === 0 && process.env.MUSIC_FOLDER_PATH) {
  configuredRoots.push(process.env.MUSIC_FOLDER_PATH);
}
const LIBRARY_ROOTS = configuredRoots.map((p) => path.resolve(p));

if (LIBRARY_ROOTS.length === 0) {
  log.warn('LIBRARY_ROOTS (and MUSIC_FOLDER_PATH) are unset; all /api/library scans will be rejected.');
}

/** Comma-separated Discord user IDs allowed to use the library scan endpoints,
 *  in addition to the trusted quick-connect ('local') identity. Filesystem
 *  paths are sensitive — this is operator-only by design, not open to every
 *  authenticated Discord user. */
const LIBRARY_ALLOWED_USERS = new Set(
  (process.env.LIBRARY_ALLOWED_USERS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);

function requireLibraryOperator(req: Request, res: Response, next: NextFunction): void {
  const auth = (req as AuthedRequest).auth;
  if (auth?.userId === 'local' || (auth?.userId && LIBRARY_ALLOWED_USERS.has(auth.userId))) {
    next();
    return;
  }
  res.status(403).json({ error: 'Not authorized to access the filesystem library' });
}
router.use(requireLibraryOperator);

/** Resolves symlinks before comparing so a symlink inside an allowed root
 *  can't be used to escape it. Returns null (disallowed) if the path doesn't
 *  exist yet or can't be resolved. */
async function pathIsAllowed(targetPath: string): Promise<boolean> {
  if (LIBRARY_ROOTS.length === 0) return false;
  let real: string;
  try {
    real = await fs.realpath(targetPath);
  } catch {
    return false;
  }
  return LIBRARY_ROOTS.some((root) => real === root || real.startsWith(root + path.sep));
}

/** Convert the bot-internal LocalTrack shape (camelCase) to the snake_case
 *  shape produced by the Tauri Rust commands, so desktop clients get the same
 *  response shape from either transport. */
function toWireFormat(t: LocalTrack) {
  return {
    file_path: t.filePath,
    file_name: t.fileName,
    title: t.title,
    artist: t.artist,
    album: t.album,
    duration: t.duration,
    size: t.size,
    media_type: t.mediaType,
  };
}

/** POST /api/library/scan — scan a folder recursively and return tracks. */
router.post('/scan', async (req: Request, res: Response) => {
  const { path: folderPath } = req.body as { path?: string };
  if (!folderPath || typeof folderPath !== 'string') {
    return res.status(400).json({ error: 'path is required' });
  }
  if (!pathIsAllowed(folderPath)) {
    return res.status(403).json({ error: 'Path is not inside LIBRARY_ROOTS' });
  }
  try {
    const tracks = await localMusicService.scanFolder(folderPath);
    res.json(tracks.map(toWireFormat));
  } catch (err) {
    log.error({ err, folderPath }, 'scan failed');
    res.status(500).json({ error: 'Scan failed' });
  }
});

/** POST /api/library/resolve — given a mix of file paths, return track metadata
 *  for the playable files (mirrors Tauri's `resolve_dropped_paths`). */
router.post('/resolve', async (req: Request, res: Response) => {
  const { paths } = req.body as { paths?: string[] };
  if (!Array.isArray(paths)) {
    return res.status(400).json({ error: 'paths must be an array' });
  }

  const tracks: LocalTrack[] = [];
  for (const p of paths) {
    if (typeof p !== 'string' || !pathIsAllowed(p)) continue;
    try {
      const stat = await fs.stat(p);
      if (stat.isDirectory()) {
        tracks.push(...(await localMusicService.scanFolder(p)));
      } else if (stat.isFile()) {
        // Single-file resolve: scan its parent and filter to this file.
        const dir = path.dirname(p);
        const siblings = await localMusicService.scanFolder(dir);
        const match = siblings.find((t) => path.resolve(t.filePath) === path.resolve(p));
        if (match) tracks.push(match);
      }
    } catch (err) {
      log.warn({ err, path: p }, 'resolve entry failed');
    }
  }
  res.json(tracks.map(toWireFormat));
});

/** POST /api/library/is-directory — mirrors Tauri's `is_directory` check. */
router.post('/is-directory', async (req: Request, res: Response) => {
  const { path: p } = req.body as { path?: string };
  if (!p || typeof p !== 'string') {
    return res.status(400).json({ error: 'path is required' });
  }
  if (!pathIsAllowed(p)) {
    return res.status(403).json({ error: 'Path is not inside LIBRARY_ROOTS' });
  }
  try {
    const stat = await fs.stat(p);
    res.json({ isDirectory: stat.isDirectory() });
  } catch {
    res.json({ isDirectory: false });
  }
});

export default router;
