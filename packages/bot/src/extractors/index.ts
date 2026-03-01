import { Player } from 'discord-player';
import { AttachmentExtractor } from '@discord-player/extractor';
import { CustomYouTubeExtractor } from './YouTubeExtractor.js';
import { SpotifyExtractor } from './SpotifyExtractor.js';
import { SoundCloudExtractor } from './SoundCloudExtractor.js';
import { AppleMusicExtractor } from './AppleMusicExtractor.js';
import { LocalExtractor } from './LocalExtractor.js';
import { createLogger } from '../helpers/logger.js';

const log = createLogger('extractors');

/**
 * Register all music platform extractors with the discord-player instance.
 *
 * Extractor priority (first match wins):
 * 1. AttachmentExtractor — Discord message attachments
 * 2. CustomYouTubeExtractor — YouTube URLs + search (youtubei.js)
 * 3. SpotifyExtractor — Spotify URLs, bridged to YouTube for streaming
 * 4. SoundCloudExtractor — SoundCloud URLs + search
 * 5. AppleMusicExtractor — Apple Music URLs + search, bridged to YouTube
 * 6. LocalExtractor — Local file paths
 */
export async function registerExtractors(player: Player): Promise<void> {
  // 1. Discord attachment extractor (handles file uploads in messages)
  await player.extractors.register(AttachmentExtractor, {});
  log.info('Registered AttachmentExtractor');

  // 2. Custom YouTube extractor — uses youtubei.js directly for reliable playback
  await player.extractors.register(CustomYouTubeExtractor, {
    highWaterMark: 1 << 25, // 32MB buffer
  });
  log.info('Registered CustomYouTubeExtractor');

  // 3. Spotify extractor — resolves Spotify metadata, bridges to YouTube for audio
  await player.extractors.register(SpotifyExtractor, {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  });
  log.info('Registered SpotifyExtractor');

  // 4. SoundCloud extractor — direct SoundCloud playback
  await player.extractors.register(SoundCloudExtractor, {});
  log.info('Registered SoundCloudExtractor');

  // 5. Apple Music extractor — resolves Apple Music metadata, bridges to YouTube
  await player.extractors.register(AppleMusicExtractor, {
    storefront: process.env.APPLE_MUSIC_STOREFRONT ?? 'us',
  });
  log.info('Registered AppleMusicExtractor');

  // 6. Local file extractor — plays from configured music folders
  await player.extractors.register(LocalExtractor, {
    musicFolders: process.env.MUSIC_FOLDER_PATH ? [process.env.MUSIC_FOLDER_PATH] : [],
  });
  log.info('Registered LocalExtractor');

  log.info('All extractors registered successfully');
}

/**
 * Supported platform identifiers for search queries.
 */
export const PLATFORMS = {
  YOUTUBE: 'youtube',
  SPOTIFY: 'spotify',
  SOUNDCLOUD: 'soundcloud',
  APPLE_MUSIC: 'apple_music',
  LOCAL: 'local',
  AUTO: 'auto',
} as const;

export type Platform = (typeof PLATFORMS)[keyof typeof PLATFORMS];

// Re-export extractors for direct access
export { CustomYouTubeExtractor } from './YouTubeExtractor.js';
export { SpotifyExtractor } from './SpotifyExtractor.js';
export { SoundCloudExtractor } from './SoundCloudExtractor.js';
export { AppleMusicExtractor } from './AppleMusicExtractor.js';
export { LocalExtractor } from './LocalExtractor.js';
