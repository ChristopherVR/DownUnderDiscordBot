// Idempotent DDL that mirrors prisma/schema.prisma. The bot connects to SQLite
// through @prisma/adapter-better-sqlite3, which never creates tables on its own -
// in dev that is handled by `pnpm db:push`, but a bundled/standalone bot points
// at a fresh empty database with no CLI available to push the schema. Running
// these statements at startup guarantees the tables exist before any query runs.
//
// GENERATED - do not hand-edit the statements. Regenerate after changing
// schema.prisma with: `node scripts/generate-schema-sql.mjs`
// (it re-derives this list from `prisma migrate diff` and re-adds IF NOT EXISTS).
export const SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS "Guild" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "defaultVolume" INTEGER NOT NULL DEFAULT 65,
    "leaveOnEmpty" BOOLEAN NOT NULL DEFAULT true,
    "leaveOnEmptyCooldown" INTEGER NOT NULL DEFAULT 300000,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
)`,
  `CREATE TABLE IF NOT EXISTS "Playlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Playlist_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE CASCADE ON UPDATE CASCADE
)`,
  `CREATE TABLE IF NOT EXISTS "PlaylistTrack" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playlistId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT,
    "duration" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail" TEXT,
    "platform" TEXT NOT NULL,
    "platformId" TEXT,
    "filePath" TEXT,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlaylistTrack_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE
)`,
  `CREATE TABLE IF NOT EXISTS "PlayHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT,
    "duration" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "platformId" TEXT,
    "playedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "PlayHistory_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE CASCADE ON UPDATE CASCADE
)`,
  `CREATE TABLE IF NOT EXISTS "QueueSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "currentTrackUrl" TEXT,
    "currentPosition" INTEGER NOT NULL DEFAULT 0,
    "volume" INTEGER NOT NULL DEFAULT 65,
    "loopMode" TEXT NOT NULL DEFAULT 'off',
    "tracks" TEXT NOT NULL,
    "voiceChannelId" TEXT,
    "textChannelId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QueueSnapshot_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE CASCADE ON UPDATE CASCADE
)`,
  `CREATE TABLE IF NOT EXISTS "UserPreferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "volume" INTEGER NOT NULL DEFAULT 65,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserPreferences_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE CASCADE ON UPDATE CASCADE
)`,
  `CREATE TABLE IF NOT EXISTS "CommandExecution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "command" TEXT NOT NULL,
    "arguments" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "result" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS "TrackCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT,
    "duration" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE INDEX IF NOT EXISTS "Playlist_guildId_userId_idx" ON "Playlist"("guildId", "userId")`,
  `CREATE INDEX IF NOT EXISTS "PlaylistTrack_playlistId_idx" ON "PlaylistTrack"("playlistId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "PlaylistTrack_playlistId_position_key" ON "PlaylistTrack"("playlistId", "position")`,
  `CREATE INDEX IF NOT EXISTS "PlayHistory_guildId_playedAt_idx" ON "PlayHistory"("guildId", "playedAt")`,
  `CREATE INDEX IF NOT EXISTS "PlayHistory_userId_idx" ON "PlayHistory"("userId")`,
  `CREATE INDEX IF NOT EXISTS "QueueSnapshot_guildId_createdAt_idx" ON "QueueSnapshot"("guildId", "createdAt")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "UserPreferences_guildId_userId_key" ON "UserPreferences"("guildId", "userId")`,
  `CREATE INDEX IF NOT EXISTS "CommandExecution_command_idx" ON "CommandExecution"("command")`,
  `CREATE INDEX IF NOT EXISTS "CommandExecution_status_idx" ON "CommandExecution"("status")`,
  `CREATE INDEX IF NOT EXISTS "CommandExecution_timestamp_idx" ON "CommandExecution"("timestamp")`,
  `CREATE INDEX IF NOT EXISTS "TrackCache_lastUsed_idx" ON "TrackCache"("lastUsed")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "TrackCache_platform_platformId_key" ON "TrackCache"("platform", "platformId")`,
];
