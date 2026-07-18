import { Request, Response, Router } from 'express';
import type { Router as RouterType } from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import { LocalMusicService, type LocalTrack } from '../services/LocalMusicService.js';
import { createLogger } from '../helpers/logger.js';
import { pathIsAllowed, requireLibraryOperator } from '../helpers/libraryRoots.js';

const log = createLogger('library');
const router: RouterType = Router();

const localMusicService = new LocalMusicService();

router.use(requireLibraryOperator);

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

/** POST /api/library/scan - scan a folder recursively and return tracks. */
router.post('/scan', async (req: Request, res: Response) => {
  const { path: folderPath } = req.body as { path?: string };
  if (!folderPath || typeof folderPath !== 'string') {
    return res.status(400).json({ error: 'path is required' });
  }
  if (!(await pathIsAllowed(folderPath))) {
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

/** POST /api/library/resolve - given a mix of file paths, return track metadata
 *  for the playable files (mirrors Tauri's `resolve_dropped_paths`). */
router.post('/resolve', async (req: Request, res: Response) => {
  const { paths } = req.body as { paths?: string[] };
  if (!Array.isArray(paths)) {
    return res.status(400).json({ error: 'paths must be an array' });
  }

  const tracks: LocalTrack[] = [];
  for (const p of paths) {
    if (typeof p !== 'string' || !(await pathIsAllowed(p))) continue;
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

/** POST /api/library/is-directory - mirrors Tauri's `is_directory` check. */
router.post('/is-directory', async (req: Request, res: Response) => {
  const { path: p } = req.body as { path?: string };
  if (!p || typeof p !== 'string') {
    return res.status(400).json({ error: 'path is required' });
  }
  if (!(await pathIsAllowed(p))) {
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
