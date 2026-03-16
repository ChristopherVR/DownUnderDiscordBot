/**
 * yt-dlp wrapper for reliable YouTube audio streaming.
 *
 * youtubei.js v16 can no longer extract stream URLs from YouTube's API
 * (format.url, cipher, and signature_cipher all return undefined).
 * yt-dlp remains the most reliable way to resolve audio stream URLs.
 */

import { execFile, spawn } from 'child_process';
import { PassThrough } from 'stream';
import { createLogger } from './logger.js';

const log = createLogger('yt-dlp');

const YT_DLP_BIN = process.env.YT_DLP_PATH || 'yt-dlp';

/** Common args shared by all yt-dlp invocations. */
const COMMON_ARGS = [
  '--no-warnings',
  '--no-playlist',
  '--js-runtimes',
  'nodejs', // Required — YouTube needs a JS runtime for URL decryption
];

/**
 * Get the direct audio stream URL for a YouTube video using yt-dlp.
 * Returns a pre-signed URL that can be fetched/proxied directly.
 */
export async function getAudioStreamUrl(videoUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = ['-f', 'bestaudio/best', '--get-url', ...COMMON_ARGS, videoUrl];

    log.debug({ videoUrl, args }, 'Resolving audio URL via yt-dlp');

    execFile(YT_DLP_BIN, args, { timeout: 30_000 }, (error, stdout, stderr) => {
      if (error) {
        log.error({ error: error.message, stderr, videoUrl }, 'yt-dlp failed to resolve URL');
        reject(new Error(`yt-dlp failed: ${error.message}`));
        return;
      }

      const url = stdout.trim();
      if (!url || !url.startsWith('http')) {
        log.error({ stdout, stderr, videoUrl }, 'yt-dlp returned invalid URL');
        reject(new Error('yt-dlp returned no valid URL'));
        return;
      }

      log.debug({ videoUrl }, 'Audio URL resolved via yt-dlp');
      resolve(url);
    });
  });
}

/**
 * Stream audio data from a YouTube video directly through a PassThrough stream.
 * Uses yt-dlp's `-o -` to pipe raw audio to stdout.
 *
 * Returns a Promise that resolves with the stream once the first chunk of data
 * arrives, or rejects if yt-dlp exits/errors before producing any output.
 * This ensures callers can fall back to other stream methods on failure.
 */
export function streamAudio(videoUrl: string): Promise<PassThrough> {
  return new Promise((resolve, reject) => {
    const passthrough = new PassThrough({ highWaterMark: 1 << 20 }); // 1 MB buffer

    const args = ['-f', 'bestaudio/best', '-o', '-', ...COMMON_ARGS, videoUrl];

    log.debug({ videoUrl }, 'Spawning yt-dlp audio stream');

    const proc = spawn(YT_DLP_BIN, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stderrBuf = '';
    let settled = false;

    proc.stderr?.on('data', (chunk: Buffer) => {
      stderrBuf += chunk.toString();
    });

    // Wait for first data chunk before resolving — proves yt-dlp is working
    proc.stdout.once('data', (chunk: Buffer) => {
      if (!settled) {
        settled = true;
        // Push the first chunk we already consumed, then pipe the rest
        passthrough.write(chunk);
        proc.stdout.pipe(passthrough);
        resolve(passthrough);
      }
    });

    proc.on('error', (err) => {
      log.error({ err, videoUrl }, 'yt-dlp process error');
      if (!settled) {
        settled = true;
        reject(err);
      } else if (!passthrough.destroyed) {
        passthrough.destroy(err);
      }
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        const msg = `yt-dlp exited with code ${code}: ${stderrBuf.slice(0, 500)}`;
        log.error({ code, stderr: stderrBuf.slice(0, 500), videoUrl }, 'yt-dlp stream exited with error');
        if (!settled) {
          settled = true;
          reject(new Error(msg));
        } else if (!passthrough.destroyed) {
          passthrough.destroy(new Error(msg));
        }
      } else if (!settled) {
        // Process exited cleanly but produced no data
        settled = true;
        reject(new Error('yt-dlp produced no output'));
      }
    });

    // Clean up yt-dlp process if the passthrough is destroyed (client disconnects)
    passthrough.on('close', () => {
      if (!proc.killed) {
        proc.kill('SIGTERM');
      }
    });
  });
}

/**
 * Verify yt-dlp is available on the system.
 */
export async function checkYtDlp(): Promise<boolean> {
  return new Promise((resolve) => {
    execFile(YT_DLP_BIN, ['--version'], { timeout: 5000 }, (error, stdout) => {
      if (error) {
        log.warn('yt-dlp not found or not working — YouTube streaming will be unavailable');
        resolve(false);
      } else {
        log.info({ version: stdout.trim() }, 'yt-dlp available');
        resolve(true);
      }
    });
  });
}
