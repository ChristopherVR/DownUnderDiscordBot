/**
 * Canonical fixture catalog shared between the bot test-mode runtime and the
 * Playwright E2E harness. Test authors consume the typed constants exported
 * here to drive UI assertions and arrange helper calls.
 *
 * This module is pure data (no Discord.js / Prisma imports) so it can be
 * referenced from the `packages/e2e` workspace without pulling the bot runtime
 * into the test process.
 */

export interface FixtureUser {
  readonly id: string;
  readonly username: string;
  readonly avatar: string | null;
}

export interface FixtureVoiceChannel {
  readonly id: string;
  readonly name: string;
  readonly userCount: number;
}

export interface FixtureGuild {
  readonly id: string;
  readonly name: string;
  readonly icon: string | null;
  readonly memberCount: number;
}

export interface FixtureTrack {
  readonly id: string;
  readonly title: string;
  readonly artist: string;
  readonly duration: number; // seconds
  readonly url: string;
  readonly thumbnail: string;
  readonly platform: 'test';
}

export interface FixturePlaylist {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly trackIds: readonly string[];
}

export const FIXTURE_USER: FixtureUser = {
  id: 'test-user-1',
  username: 'TestUser',
  avatar: null,
};

export const FIXTURE_GUILDS: readonly FixtureGuild[] = [
  {
    id: 'test-guild-1',
    name: 'Test Guild',
    icon: null,
    memberCount: 10,
  },
];

export const FIXTURE_VOICE_CHANNELS: Readonly<Record<string, readonly FixtureVoiceChannel[]>> = {
  'test-guild-1': [
    { id: 'voice-1', name: 'General', userCount: 0 },
    { id: 'voice-2', name: 'Music', userCount: 0 },
  ],
};

export const FIXTURE_TRACKS: readonly FixtureTrack[] = [
  {
    id: 'song-1',
    title: 'Test Song 1',
    artist: 'Test Artist A',
    duration: 30,
    url: 'test:song-1',
    thumbnail: '',
    platform: 'test',
  },
  {
    id: 'song-2',
    title: 'Test Song 2',
    artist: 'Test Artist B',
    duration: 30,
    url: 'test:song-2',
    thumbnail: '',
    platform: 'test',
  },
  {
    id: 'song-3',
    title: 'Test Song 3',
    artist: 'Test Artist C',
    duration: 30,
    url: 'test:song-3',
    thumbnail: '',
    platform: 'test',
  },
];

export const FIXTURE_PLAYLIST: FixturePlaylist = {
  id: 'playlist-1',
  name: 'Seed Playlist',
  description: 'Seeded fixture playlist for E2E tests',
  trackIds: ['song-1', 'song-2'],
};

/** Convenience lookup: track id → track. */
export const FIXTURE_TRACK_BY_ID: Readonly<Record<string, FixtureTrack>> = Object.fromEntries(
  FIXTURE_TRACKS.map((t) => [t.id, t]),
);

/** Convenience lookup: bare title / "test:<id>" / free-text → track. */
export function findFixtureTrack(query: string): FixtureTrack | undefined {
  if (!query) return undefined;
  const trimmed = query.trim();
  if (trimmed.toLowerCase().startsWith('test:')) {
    const id = trimmed.slice(5).toLowerCase();
    return FIXTURE_TRACKS.find((t) => t.id.toLowerCase() === id);
  }
  const lower = trimmed.toLowerCase();
  return (
    FIXTURE_TRACKS.find((t) => t.title.toLowerCase() === lower) ??
    FIXTURE_TRACKS.find((t) => t.title.toLowerCase().includes(lower)) ??
    FIXTURE_TRACKS.find((t) => t.artist.toLowerCase().includes(lower))
  );
}

export interface FixtureData {
  readonly user: FixtureUser;
  readonly guilds: readonly FixtureGuild[];
  readonly voiceChannels: Readonly<Record<string, readonly FixtureVoiceChannel[]>>;
  readonly tracks: readonly FixtureTrack[];
  readonly playlist: FixturePlaylist;
}

export const FIXTURES: FixtureData = {
  user: FIXTURE_USER,
  guilds: FIXTURE_GUILDS,
  voiceChannels: FIXTURE_VOICE_CHANNELS,
  tracks: FIXTURE_TRACKS,
  playlist: FIXTURE_PLAYLIST,
};
