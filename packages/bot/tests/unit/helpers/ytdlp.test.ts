import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────────
const execFileMock = vi.hoisted(() => vi.fn());
const spawnMock = vi.hoisted(() => vi.fn());

vi.mock('child_process', () => ({
  execFile: execFileMock,
  spawn: spawnMock,
}));

vi.mock('../../../src/helpers/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  }),
}));

import { getAudioStreamUrl, streamAudio, checkYtDlp } from '../../../src/helpers/ytdlp';
import { EventEmitter } from 'events';
import { PassThrough } from 'stream';

describe('yt-dlp helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── getAudioStreamUrl ──────────────────────────────────────────────

  describe('getAudioStreamUrl', () => {
    it('resolves with the trimmed URL on success', async () => {
      execFileMock.mockImplementation(
        (
          _bin: string,
          _args: string[],
          _opts: unknown,
          cb: (err: Error | null, stdout: string, stderr: string) => void,
        ) => {
          cb(null, 'https://audio.googlevideo.com/stream?id=123\n', '');
        },
      );

      const url = await getAudioStreamUrl('https://youtube.com/watch?v=abc');

      expect(url).toBe('https://audio.googlevideo.com/stream?id=123');
      expect(execFileMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['-f', 'bestaudio/best', '--get-url', 'https://youtube.com/watch?v=abc']),
        expect.objectContaining({ timeout: 30_000 }),
        expect.any(Function),
      );
    });

    it('rejects when execFile returns an error', async () => {
      execFileMock.mockImplementation(
        (
          _bin: string,
          _args: string[],
          _opts: unknown,
          cb: (err: Error | null, stdout: string, stderr: string) => void,
        ) => {
          cb(new Error('yt-dlp not found'), '', 'command not found');
        },
      );

      await expect(getAudioStreamUrl('https://youtube.com/watch?v=abc')).rejects.toThrow('yt-dlp failed');
    });

    it('rejects when stdout is empty', async () => {
      execFileMock.mockImplementation(
        (
          _bin: string,
          _args: string[],
          _opts: unknown,
          cb: (err: Error | null, stdout: string, stderr: string) => void,
        ) => {
          cb(null, '', '');
        },
      );

      await expect(getAudioStreamUrl('https://youtube.com/watch?v=abc')).rejects.toThrow(
        'yt-dlp returned no valid URL',
      );
    });

    it('rejects when stdout is not a valid URL', async () => {
      execFileMock.mockImplementation(
        (
          _bin: string,
          _args: string[],
          _opts: unknown,
          cb: (err: Error | null, stdout: string, stderr: string) => void,
        ) => {
          cb(null, 'not-a-url', '');
        },
      );

      await expect(getAudioStreamUrl('https://youtube.com/watch?v=abc')).rejects.toThrow(
        'yt-dlp returned no valid URL',
      );
    });
  });

  // ── streamAudio ────────────────────────────────────────────────────

  describe('streamAudio', () => {
    function createMockProcess() {
      const proc = new EventEmitter() as EventEmitter & {
        stdout: EventEmitter & { pipe: ReturnType<typeof vi.fn> };
        stderr: EventEmitter;
        killed: boolean;
        kill: ReturnType<typeof vi.fn>;
      };
      proc.stdout = new EventEmitter() as EventEmitter & { pipe: ReturnType<typeof vi.fn> };
      proc.stdout.pipe = vi.fn().mockReturnValue(new PassThrough());
      proc.stderr = new EventEmitter();
      proc.killed = false;
      proc.kill = vi.fn(() => {
        proc.killed = true;
      });
      return proc;
    }

    it('resolves with a PassThrough stream once first data chunk arrives', async () => {
      const proc = createMockProcess();
      spawnMock.mockReturnValue(proc);

      const promise = streamAudio('https://youtube.com/watch?v=abc');

      // Simulate first data chunk
      proc.stdout.emit('data', Buffer.from('audio-data'));

      const stream = await promise;
      expect(stream).toBeInstanceOf(PassThrough);
      expect(proc.stdout.pipe).toHaveBeenCalled();
    });

    it('rejects when process errors before producing data', async () => {
      const proc = createMockProcess();
      spawnMock.mockReturnValue(proc);

      const promise = streamAudio('https://youtube.com/watch?v=abc');

      proc.emit('error', new Error('spawn ENOENT'));

      await expect(promise).rejects.toThrow('spawn ENOENT');
    });

    it('rejects when process exits with non-zero code before data', async () => {
      const proc = createMockProcess();
      spawnMock.mockReturnValue(proc);

      const promise = streamAudio('https://youtube.com/watch?v=abc');

      proc.stderr.emit('data', Buffer.from('ERROR: Video unavailable'));
      proc.emit('close', 1);

      await expect(promise).rejects.toThrow('yt-dlp exited with code 1');
    });

    it('rejects when process exits cleanly but produces no output', async () => {
      const proc = createMockProcess();
      spawnMock.mockReturnValue(proc);

      const promise = streamAudio('https://youtube.com/watch?v=abc');

      proc.emit('close', 0);

      await expect(promise).rejects.toThrow('yt-dlp produced no output');
    });

    it('destroys passthrough when process errors after data was produced', async () => {
      const proc = createMockProcess();
      spawnMock.mockReturnValue(proc);

      const promise = streamAudio('https://youtube.com/watch?v=abc');

      // First data arrives - settles the promise
      proc.stdout.emit('data', Buffer.from('audio-data'));
      const stream = await promise;

      // Prevent unhandled error from crashing the test
      stream.on('error', () => {});

      // Then error occurs
      proc.emit('error', new Error('late error'));

      expect(stream.destroyed).toBe(true);
    });

    it('destroys passthrough when process exits with error after data', async () => {
      const proc = createMockProcess();
      spawnMock.mockReturnValue(proc);

      const promise = streamAudio('https://youtube.com/watch?v=abc');

      proc.stdout.emit('data', Buffer.from('audio-data'));
      const stream = await promise;

      // Prevent unhandled error from crashing the test
      stream.on('error', () => {});

      proc.emit('close', 1);

      expect(stream.destroyed).toBe(true);
    });

    it('kills yt-dlp process when passthrough stream is closed', async () => {
      const proc = createMockProcess();
      spawnMock.mockReturnValue(proc);

      const promise = streamAudio('https://youtube.com/watch?v=abc');

      proc.stdout.emit('data', Buffer.from('audio-data'));
      const stream = await promise;

      // Wait for the close event to fire and trigger the kill
      await new Promise<void>((resolve) => {
        stream.on('close', () => resolve());
        stream.destroy();
      });

      expect(proc.kill).toHaveBeenCalledWith('SIGTERM');
    });

    it('passes correct arguments to spawn', () => {
      const proc = createMockProcess();
      spawnMock.mockReturnValue(proc);

      streamAudio('https://youtube.com/watch?v=test');

      expect(spawnMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['-f', 'bestaudio/best', '-o', '-', 'https://youtube.com/watch?v=test']),
        expect.objectContaining({ stdio: ['ignore', 'pipe', 'pipe'] }),
      );
    });
  });

  // ── checkYtDlp ─────────────────────────────────────────────────────

  describe('checkYtDlp', () => {
    it('resolves true when yt-dlp is available', async () => {
      execFileMock.mockImplementation(
        (_bin: string, _args: string[], _opts: unknown, cb: (err: Error | null, stdout: string) => void) => {
          cb(null, '2024.01.01\n');
        },
      );

      const result = await checkYtDlp();
      expect(result).toBe(true);
    });

    it('resolves false when yt-dlp is not found', async () => {
      execFileMock.mockImplementation(
        (_bin: string, _args: string[], _opts: unknown, cb: (err: Error | null, stdout: string) => void) => {
          cb(new Error('ENOENT'), '');
        },
      );

      const result = await checkYtDlp();
      expect(result).toBe(false);
    });

    it('calls yt-dlp with --version flag', async () => {
      execFileMock.mockImplementation(
        (_bin: string, _args: string[], _opts: unknown, cb: (err: Error | null, stdout: string) => void) => {
          cb(null, '2024.01.01');
        },
      );

      await checkYtDlp();

      expect(execFileMock).toHaveBeenCalledWith(
        expect.any(String),
        ['--version'],
        expect.objectContaining({ timeout: 5000 }),
        expect.any(Function),
      );
    });
  });
});
