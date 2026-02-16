import { Player } from 'discord-player';
import { AttachmentExtractor } from '@discord-player/extractor';
import { YoutubeiExtractor } from 'discord-player-youtubei';
import { ClientType, Innertube } from 'youtubei.js';
import { URL } from 'node:url';
import { Readable } from 'stream';
import { createLogger } from '../helpers/logger.js';

const log = createLogger('extractors');

/**
 * Register all music platform extractors with the discord-player instance.
 * This centralizes extractor setup that was previously in player.ts.
 */
export async function registerExtractors(player: Player): Promise<void> {
  // 1. Attachment extractor (local file uploads)
  await player.extractors.register(AttachmentExtractor, {});
  log.info('Registered AttachmentExtractor');

  // 2. YouTube extractor (primary)
  await player.extractors.register(YoutubeiExtractor, {
    innertubeConfigRaw: {
      player_id: '0004de42',
      client_type: 'WEB',
      gl: 'ZA',
      hl: 'en',
    },
    streamOptions: { highWaterMark: 1 << 25 },

    createStream: async (track) => {
      const url = track.url;
      if (!url) throw new Error('Track has no URL');

      try {
        const innerTube = await Innertube.create({
          player_id: '0004de42',
          client_type: ClientType.ANDROID,
        });

        const parsed = new URL(url);
        const vidId = parsed.searchParams.get('v');
        const info = await innerTube.getBasicInfo(vidId!);
        const stream = await info.download();

        return Readable.from(stream);
      } catch (err) {
        log.error({ err, url }, 'YouTube stream fallback failed');
        throw err;
      }
    },
  });
  log.info('Registered YoutubeiExtractor');

  // 3. Spotify extractor — uses YouTube as playback backend
  // discord-player has built-in Spotify support when a bridge extractor (like YoutubeiExtractor) is available.
  // Spotify URLs/queries are resolved to metadata then bridged to YouTube for streaming.
  // No additional registration needed — YoutubeiExtractor acts as the bridge.
  log.info('Spotify support enabled via YouTube bridge');

  // 4. SoundCloud — discord-player has built-in SoundCloud support via default extractors
  // The @discord-player/extractor package includes SoundCloudExtractor
  // It's automatically available through player.search() with QueryType.SOUNDCLOUD_SEARCH
  log.info('SoundCloud support enabled via built-in extractor');

  log.info('All extractors registered');
}

/**
 * Supported platform identifiers for search queries.
 */
export const PLATFORMS = {
  YOUTUBE: 'youtube',
  SPOTIFY: 'spotify',
  SOUNDCLOUD: 'soundcloud',
  LOCAL: 'local',
  AUTO: 'auto',
} as const;

export type Platform = (typeof PLATFORMS)[keyof typeof PLATFORMS];
