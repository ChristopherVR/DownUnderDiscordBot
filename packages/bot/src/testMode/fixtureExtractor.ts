/**
 * FixtureExtractor
 *
 * A `BaseExtractor` implementation used exclusively in E2E (`E2E=true`) mode.
 *
 * It replaces every real platform extractor so that:
 *  - Search queries never hit the network.
 *  - `validate()` accepts `test:<id>` URIs plus free-text queries that match a
 *    title / artist in the fixture catalog.
 *  - `stream()` returns a `ReadStream` over a bundled silent WAV file
 *    (generated at module load time). This must be a `Readable` — returning
 *    the path string would route discord-player through `FFMPEG_ARGS_STRING`
 *    which appends HTTP-reconnect flags invalid for local files.
 *
 * We do NOT explicitly type `handle()` / `stream()` return values — discord-
 * player's `BaseExtractor.handle()` declares `ExtractorInfo`, not
 * `SearchResult`, and `stream()` expects `ExtractorStreamable`
 * (`Readable | string | { stream: Readable }`). Let TypeScript infer.
 */
import { BaseExtractor, Track, QueryType } from 'discord-player';
import type { ExtractorSearchContext } from 'discord-player';
import { createReadStream, writeFileSync, existsSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { createLogger } from '../helpers/logger.js';
import { FIXTURE_TRACKS, findFixtureTrack, type FixtureTrack } from './fixtures.js';

const log = createLogger('fixture-extractor');

const SAMPLE_RATE = 44100;
const CHANNELS = 2;
const BITS_PER_SAMPLE = 16;
const DURATION_SECONDS = 30;

/**
 * Generate a 30-second 44.1kHz 16-bit stereo silent WAV file and return its
 * path. The file is cached in the OS temp directory so subsequent bot starts
 * reuse the same file.
 */
function ensureSilenceFile(): string {
  const dir = path.join(tmpdir(), 'downunder-e2e');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const filePath = path.join(dir, `silence-${DURATION_SECONDS}s.wav`);
  if (existsSync(filePath)) return filePath;

  const byteRate = (SAMPLE_RATE * CHANNELS * BITS_PER_SAMPLE) / 8;
  const blockAlign = (CHANNELS * BITS_PER_SAMPLE) / 8;
  const numSamples = SAMPLE_RATE * DURATION_SECONDS;
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8, 'ascii');
  // fmt chunk
  buffer.write('fmt ', 12, 'ascii');
  buffer.writeUInt32LE(16, 16); // PCM chunk size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(CHANNELS, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(BITS_PER_SAMPLE, 34);
  // data chunk
  buffer.write('data', 36, 'ascii');
  buffer.writeUInt32LE(dataSize, 40);
  // Payload is already zero-initialised by Buffer.alloc → silence.

  writeFileSync(filePath, buffer);
  log.info({ filePath, seconds: DURATION_SECONDS }, 'Generated silent WAV fixture file');
  return filePath;
}

const SILENCE_PATH = ensureSilenceFile();

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export class FixtureExtractor extends BaseExtractor {
  static identifier = 'com.downunder.e2e.fixture' as const;

  async activate(): Promise<void> {
    log.info({ tracks: FIXTURE_TRACKS.length }, 'FixtureExtractor activated');
  }

  async deactivate(): Promise<void> {
    log.info('FixtureExtractor deactivated');
  }

  async validate(query: string): Promise<boolean> {
    if (!query) return false;
    if (query.toLowerCase().startsWith('test:')) return true;
    return !!findFixtureTrack(query);
  }

  async handle(query: string, context: ExtractorSearchContext) {
    const fixtureTrack = findFixtureTrack(query);
    if (!fixtureTrack) {
      log.warn({ query }, 'FixtureExtractor: no matching fixture track');
      return this.createResponse(null, []);
    }
    const track = this.buildTrack(fixtureTrack, context);
    return this.createResponse(null, [track]);
  }

  async stream(_track: Track) {
    // Must return a Readable — see header comment for why a path string would
    // break playback on local files.
    return createReadStream(SILENCE_PATH);
  }

  private buildTrack(fixture: FixtureTrack, context: ExtractorSearchContext): Track {
    const track = new Track(this.context.player, {
      title: fixture.title,
      author: fixture.artist,
      url: fixture.url,
      thumbnail: fixture.thumbnail,
      duration: formatDuration(fixture.duration),
      requestedBy: context.requestedBy,
      source: 'arbitrary',
      queryType: QueryType.ARBITRARY,
      metadata: { fixtureId: fixture.id },
    });
    track.extractor = this;
    return track;
  }
}

export { SILENCE_PATH as FIXTURE_SILENCE_PATH };
