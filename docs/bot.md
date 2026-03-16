# Bot Documentation

The bot package (`packages/bot/`) is the core of the project. It runs as a Node.js process that connects to Discord, handles slash commands, manages music playback, and exposes a REST + WebSocket API for the desktop dashboard.

## Table of Contents

- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Startup Flow](#startup-flow)
- [Slash Commands](#slash-commands)
- [REST API](#rest-api)
- [WebSocket Protocol](#websocket-protocol)
- [Database Schema](#database-schema)
- [Music Extractors](#music-extractors)
- [Local Music](#local-music)
- [State Coordination](#state-coordination)
- [Project Structure](#project-structure)

---

## Getting Started

```bash
# Install dependencies (from repo root)
pnpm install

# Set up database
pnpm db:push

# Development (hot reload)
pnpm dev

# Production
pnpm build
pnpm start
```

The bot starts an Express server on the configured port (default 3000, recommended 3001 via `.env`) and connects to Discord using the provided token.

---

## Environment Variables

Configure these in `packages/bot/.env`:

| Variable                  | Required | Default              | Description                                                                   |
| ------------------------- | -------- | -------------------- | ----------------------------------------------------------------------------- |
| `CLIENT_TOKEN`            | Yes      | --                   | Discord bot token from the Developer Portal                                   |
| `GUILD_ID`                | Yes      | --                   | Discord server (guild) ID for command registration                            |
| `PORT`                    | No       | `3000`               | HTTP/WebSocket server port (`.env.example` uses 3001)                         |
| `HOST`                    | No       | `localhost`          | Server bind address                                                           |
| `DATABASE_URL`            | No       | `file:./data/bot.db` | SQLite database file path (Prisma format)                                     |
| `FFMPEG_PATH`             | No       | `ffmpeg`             | Path to FFmpeg binary                                                         |
| `MUSIC_FOLDER_PATH`       | No       | --                   | Default local music folder to scan                                            |
| `MUSIC_CHANNEL_ID`        | No       | --                   | Discord channel ID for music notifications                                    |
| `STATE_CHANNEL_ID`        | No       | --                   | Discord channel for multi-instance state coordination                         |
| `STATE_BACKEND`           | No       | `channel`            | State persistence backend (`channel`)                                         |
| `OPEN_AI_TOKEN`           | No       | --                   | OpenAI API key (for `/ask` command)                                           |
| `SPOTIFY_CLIENT_ID`       | No       | --                   | Spotify API client ID (enables Spotify search)                                |
| `SPOTIFY_CLIENT_SECRET`   | No       | --                   | Spotify API client secret                                                     |
| `DISCORD_CLIENT_ID`       | No       | --                   | Discord application client ID (auto-detected from token if unset)             |
| `DISCORD_CLIENT_SECRET`   | No       | --                   | Discord OAuth2 client secret (enables OAuth login)                            |
| `DISCORD_REDIRECT_URI`    | No       | auto                 | OAuth2 redirect URI (defaults to `http://localhost:{PORT}/api/auth/callback`) |
| `JWT_SECRET`              | No       | dev default          | Secret for signing JWT auth tokens                                            |
| `ENVIRONMENT`             | No       | `development`        | Environment name                                                              |
| `PROTOCOL`                | No       | `http`               | Protocol for external URLs                                                    |
| `EXTERNAL_DNS_NAME_OR_IP` | No       | --                   | Public hostname or IP                                                         |

---

## Startup Flow

When the bot starts (`packages/bot/src/index.ts`):

1. Loads environment variables from `.env`
2. Initializes i18n localization system (locale files from `packages/shared/`)
3. Creates Express app with CORS and JSON body parsing
4. Creates HTTP server and WebSocket server on `/ws` path
5. Sets up logging infrastructure (Pino with rotation)
6. Calls `startBot()` which:
   - Creates Discord.js client with required intents (Guilds, GuildMessages, MessageContent, GuildVoiceStates)
   - Initializes the music `Player` with `registerExtractors()`
   - Sets up slash command handling via `CommandRegistry`
   - Creates `StateCoordinator` for distributed state
   - Starts a heartbeat (every 15s) for instance presence
   - Logs in to Discord
7. Mounts API routes:
   - `/api/health` -- health check
   - `/api/locales` -- i18n locale bundles
   - `/api/bot/status` -- bot online status
   - `/api/dashboard` -- comprehensive system status aggregation
   - `/api/guild/:guildId/voice-channels` -- guild voice channels
   - `/api/instances/*` -- instance management (force-stop, ping, stale cleanup)
   - `/api/auth` -- Discord OAuth2 authentication
   - `/api/upload` -- file upload endpoints
   - `/api/music` -- music player endpoints
   - `/api/playlists` -- playlist CRUD endpoints
   - `/api/commands` -- command registry and execution
   - `/api/channels` -- Discord channel messages (chat)
   - `/api/logs` -- audit and command logs
   - `/api/websocket/*` -- WebSocket stats and broadcast
   - `/api/state/*` -- state coordination management
8. Starts listening on the configured port

---

## Slash Commands

All 26 commands are in `packages/bot/src/commands/`. They use a unified `CommandContext` abstraction that works with both Discord interactions and dashboard API calls.

### Playback Commands

| Command       | Description                             | Options                      |
| ------------- | --------------------------------------- | ---------------------------- |
| `/play`       | Play a track or add to queue            | `query` (search term or URL) |
| `/pause`      | Pause playback                          | --                           |
| `/resume`     | Resume playback                         | --                           |
| `/stop`       | Stop playback and clear queue           | --                           |
| `/skip`       | Skip to the next track                  | --                           |
| `/back`       | Go to the previous track                | --                           |
| `/seek`       | Seek to a position in the current track | `seconds` (number)           |
| `/volume`     | Set playback volume                     | `volume` (0-100)             |
| `/loop`       | Set loop mode                           | `mode` (off, track, queue)   |
| `/nowplaying` | Show the currently playing track        | --                           |

### Queue Commands

| Command     | Description                           | Options                      |
| ----------- | ------------------------------------- | ---------------------------- |
| `/queue`    | Show the current queue                | --                           |
| `/shuffle`  | Shuffle the queue                     | --                           |
| `/clear`    | Clear the queue                       | --                           |
| `/remove`   | Remove a track by position            | `position` (number)          |
| `/jump`     | Jump to a specific track in the queue | `position` (number)          |
| `/playnext` | Add a track to play next              | `query` (search term or URL) |
| `/save`     | Save the current track to a playlist  | --                           |

### Discovery Commands

| Command     | Description             | Options                                                   |
| ----------- | ----------------------- | --------------------------------------------------------- |
| `/search`   | Search across platforms | `query`, `platform` (auto/youtube/spotify/soundcloud)     |
| `/playlist` | Manage playlists        | `action` (create/list/view/add/play/delete), `name`, `id` |
| `/history`  | View play history       | `view` (recent/most-played)                               |

### Utility Commands

| Command       | Description                 | Options           |
| ------------- | --------------------------- | ----------------- |
| `/hello`      | Greeting command            | --                |
| `/ask`        | Ask a question (OpenAI)     | `question` (text) |
| `/meme`       | Get a random meme           | --                |
| `/status`     | Show bot status and stats   | --                |
| `/set-active` | Set the active bot instance | `instance` (ID)   |
| `/shutdown`   | Shut down the bot           | --                |

### How Commands Work

Commands implement a standard interface through `CommandRegistry`:

```
packages/bot/src/helpers/commands/
├── CommandContext.ts        # Abstraction over Discord interactions + API calls
├── CommandRegistry.ts       # Discovers, loads, and routes commands
└── DiscordBotIntegration.ts # Registers commands with Discord API
```

Each command file exports:

- `data` -- A `SlashCommandBuilder` defining the command name, description, and options
- `execute(context: CommandContext)` -- The handler function

`CommandContext` provides a unified API:

- `context.getString('name')` -- Get a string option value
- `context.guildId` -- The guild ID where the command was invoked
- `context.userId` -- The user who invoked the command
- `context.member` -- The GuildMember object
- `context.reply(content)` -- Send a reply
- `context.editReply(content)` -- Edit a deferred reply
- `context.deferReply()` -- Defer the reply (for long operations)

---

## REST API

The bot exposes a REST API on the same port as the WebSocket server. All endpoints return JSON.

### Health

| Method | Path          | Description                          |
| ------ | ------------- | ------------------------------------ |
| `GET`  | `/api/health` | Health check, returns `{ ok: true }` |

### Bot Status & Dashboard

| Method | Path                                 | Description                                                             |
| ------ | ------------------------------------ | ----------------------------------------------------------------------- |
| `GET`  | `/api/bot/status`                    | Bot online status, username, and avatar                                 |
| `GET`  | `/api/dashboard`                     | Comprehensive system status (bot, guilds, player states, instances, WS) |
| `GET`  | `/api/guild/:guildId/voice-channels` | Voice channels in a guild                                               |

### Authentication (`/api/auth`)

| Method | Path             | Description                                              |
| ------ | ---------------- | -------------------------------------------------------- |
| `GET`  | `/discord`       | Returns Discord OAuth2 authorization URL                 |
| `GET`  | `/callback`      | Handles OAuth callback, exchanges code for JWT token     |
| `GET`  | `/user`          | Returns authenticated user profile (requires Bearer JWT) |
| `GET`  | `/guilds`        | Returns user's guilds cross-referenced with bot's guilds |
| `GET`  | `/status`        | Returns OAuth configuration status                       |
| `GET`  | `/quick-connect` | Returns bot's guild list without OAuth (fallback)        |

### Music Player (`/api/music`)

| Method   | Path             | Body                            | Description                                           |
| -------- | ---------------- | ------------------------------- | ----------------------------------------------------- |
| `GET`    | `/state`         | --                              | Current player state (track, position, volume, queue) |
| `GET`    | `/history`       | --                              | Playback history                                      |
| `POST`   | `/play`          | `{ query, platform?, source? }` | Play a track. `source`: `online` or `local`           |
| `POST`   | `/pause`         | --                              | Pause playback                                        |
| `POST`   | `/resume`        | --                              | Resume playback                                       |
| `POST`   | `/stop`          | --                              | Stop playback                                         |
| `POST`   | `/skip`          | --                              | Skip current track                                    |
| `POST`   | `/seek`          | `{ position }`                  | Seek to position in seconds                           |
| `POST`   | `/volume`        | `{ volume }`                    | Set volume (0-100)                                    |
| `POST`   | `/repeat`        | `{ mode }`                      | Set repeat mode: `off`, `track`, `queue`, `autoplay`  |
| `GET`    | `/queue`         | --                              | Get current queue                                     |
| `POST`   | `/queue/add`     | `{ query }`                     | Add track to queue                                    |
| `DELETE` | `/queue/:index`  | --                              | Remove track at index                                 |
| `POST`   | `/queue/clear`   | --                              | Clear the queue                                       |
| `POST`   | `/queue/shuffle` | --                              | Shuffle the queue                                     |
| `GET`    | `/search`        | `?q=&platform=`                 | Search for tracks (GET)                               |
| `POST`   | `/search`        | `{ query, searchEngine }`       | Search for tracks (POST)                              |
| `GET`    | `/local-files`   | --                              | List uploaded audio files                             |

### Playlists (`/api/playlists`)

| Method   | Path                           | Body / Headers                                | Description                   |
| -------- | ------------------------------ | --------------------------------------------- | ----------------------------- |
| `GET`    | `/`                            | `x-guild-id` header or `?guildId=`            | List playlists                |
| `GET`    | `/:id`                         | --                                            | Get playlist with tracks      |
| `POST`   | `/`                            | `{ name, description?, isPublic? }` + headers | Create a playlist             |
| `PUT`    | `/:id`                         | `{ name?, description?, isPublic? }`          | Update playlist metadata      |
| `DELETE` | `/:id`                         | --                                            | Delete a playlist             |
| `POST`   | `/:id/tracks`                  | `{ title, artist?, url?, platform, ... }`     | Add track to playlist         |
| `DELETE` | `/:id/tracks/:trackId`         | --                                            | Remove track from playlist    |
| `PUT`    | `/:id/tracks/:trackId/reorder` | `{ position }`                                | Reorder track within playlist |
| `POST`   | `/:id/play`                    | --                                            | Play entire playlist (queues) |

### Commands (`/api/commands`)

| Method   | Path                   | Body                              | Description                 |
| -------- | ---------------------- | --------------------------------- | --------------------------- |
| `GET`    | `/registry`            | --                                | List all available commands |
| `POST`   | `/execute`             | `{ command, args }`               | Execute a command           |
| `GET`    | `/history`             | `?limit=&command=&status=&since=` | Command execution history   |
| `GET`    | `/history/:id`         | --                                | Get specific execution      |
| `DELETE` | `/history`             | --                                | Clear command history       |
| `GET`    | `/stats`               | --                                | Command usage statistics    |
| `POST`   | `/validate`            | `{ command, args }`               | Validate command arguments  |
| `GET`    | `/guilds`              | --                                | List available guilds       |
| `GET`    | `/guilds/:id/channels` | --                                | List channels in a guild    |

### Channels (`/api/channels`)

| Method | Path                   | Body / Query      | Description                                         |
| ------ | ---------------------- | ----------------- | --------------------------------------------------- |
| `GET`  | `/:channelId/messages` | `?limit=&before=` | Fetch recent messages from a text channel (max 100) |
| `POST` | `/:channelId/messages` | `{ content }`     | Send a message to a text channel as the bot         |

### File Uploads (`/api/upload`)

| Method   | Path         | Body                  | Description                    |
| -------- | ------------ | --------------------- | ------------------------------ |
| `POST`   | `/single`    | `multipart/form-data` | Upload a single audio file     |
| `POST`   | `/multiple`  | `multipart/form-data` | Upload multiple files (max 10) |
| `GET`    | `/files`     | --                    | List all uploaded files        |
| `GET`    | `/files/:id` | --                    | Get file details               |
| `DELETE` | `/files/:id` | --                    | Delete a file                  |
| `GET`    | `/search`    | `?q=`                 | Search files by name           |
| `GET`    | `/stats`     | --                    | Storage statistics             |
| `POST`   | `/cleanup`   | --                    | Cleanup orphaned files         |
| `GET`    | `/serve/:id` | --                    | Stream an audio file           |

### Logs (`/api/logs`)

| Method   | Path     | Query                                                 | Description    |
| -------- | -------- | ----------------------------------------------------- | -------------- |
| `GET`    | `/`      | `?type=&query=&level=&category=&limit=&offset=&sort=` | Get logs       |
| `GET`    | `/stats` | --                                                    | Log statistics |
| `DELETE` | `/`      | `?type=&level=`                                       | Clear logs     |

### Instance Management

| Method   | Path                                    | Body                          | Description                                 |
| -------- | --------------------------------------- | ----------------------------- | ------------------------------------------- |
| `POST`   | `/api/instances/:instanceId/force-stop` | --                            | Force-stop a bot instance across all guilds |
| `POST`   | `/api/instances/ping`                   | `{ instanceId?, timeoutMs? }` | Ping instance(s) and wait for PONG          |
| `DELETE` | `/api/instances/stale`                  | --                            | Remove all timed-out / stale instances      |

### State Management (`/api/state`)

| Method | Path                  | Body                     | Description                             |
| ------ | --------------------- | ------------------------ | --------------------------------------- |
| `GET`  | `/`                   | --                       | Get full state document                 |
| `GET`  | `/:guildId/instances` | --                       | Get instances for a guild               |
| `POST` | `/:guildId/active`    | `{ instanceId }`         | Set active instance for a guild         |
| `POST` | `/:guildId/online`    | `{ instanceId, online }` | Set instance online/offline for a guild |
| `POST` | `/ping`               | `{ targetInstanceId? }`  | Send a ping via the state channel       |

### WebSocket Management

| Method | Path                       | Body                | Description                           |
| ------ | -------------------------- | ------------------- | ------------------------------------- |
| `GET`  | `/api/websocket/stats`     | --                  | WebSocket connection statistics       |
| `GET`  | `/api/websocket/clients`   | --                  | List connected WebSocket clients      |
| `POST` | `/api/websocket/broadcast` | `{ type, payload }` | Broadcast a message to all WS clients |

---

## WebSocket Protocol

Connect to `ws://host:port/ws`. Messages are JSON.

### Server-to-Client Events

| Event               | Payload                                                                | Description               |
| ------------------- | ---------------------------------------------------------------------- | ------------------------- |
| `bot_status`        | `{ online, guildId, instanceId }`                                      | Bot online/offline status |
| `player_state`      | `{ isPlaying, currentTrack, position, duration, volume, loop, queue }` | Player state update       |
| `queue_update`      | `{ queue: Track[] }`                                                   | Queue changed             |
| `track_started`     | `Track`                                                                | New track started playing |
| `track_finished`    | `Track`                                                                | Track finished            |
| `log_entry`         | `LogEntry`                                                             | New log entry             |
| `command_result`    | `CommandExecution`                                                     | Command executed          |
| `connection_update` | `ConnectionInfo`                                                       | Discord connection change |
| `file_upload`       | `FileUploadProgress`                                                   | Upload progress           |

### Client-to-Server Messages

| Message       | Payload               | Description                  |
| ------------- | --------------------- | ---------------------------- |
| `subscribe`   | `{ types: string[] }` | Subscribe to event types     |
| `unsubscribe` | `{ types: string[] }` | Unsubscribe from event types |
| `ping`        | --                    | Keepalive ping               |

### Message Format

```json
{
  "type": "player_state",
  "payload": {
    "isPlaying": true,
    "currentTrack": {
      "title": "Song Name",
      "artist": "Artist",
      "duration": 240,
      "url": "https://...",
      "thumbnail": "https://...",
      "platform": "youtube"
    },
    "position": 42,
    "duration": 240,
    "volume": 65,
    "loop": "off",
    "queue": []
  }
}
```

The server sends a heartbeat ping every 30 seconds. Dead connections are automatically cleaned up.

---

## Database Schema

The bot uses SQLite via Prisma ORM. Schema is defined in `packages/bot/prisma/schema.prisma`.

### Models

#### Guild

Stores per-server configuration.

| Field                  | Type        | Default | Description                      |
| ---------------------- | ----------- | ------- | -------------------------------- |
| `id`                   | String (PK) | --      | Discord guild ID                 |
| `name`                 | String      | --      | Server name                      |
| `preferredLanguage`    | String      | `en`    | Default language                 |
| `defaultVolume`        | Int         | `65`    | Default playback volume          |
| `leaveOnEmpty`         | Boolean     | `true`  | Leave voice when channel empties |
| `leaveOnEmptyCooldown` | Int         | `300`   | Seconds to wait before leaving   |

#### Playlist

User-created playlists, scoped to a guild.

| Field         | Type        | Description                    |
| ------------- | ----------- | ------------------------------ |
| `id`          | UUID (PK)   | Auto-generated                 |
| `guildId`     | String (FK) | Guild this playlist belongs to |
| `userId`      | String      | Discord user who created it    |
| `name`        | String      | Playlist name                  |
| `description` | String?     | Optional description           |
| `isPublic`    | Boolean     | Whether other users can see it |

#### PlaylistTrack

Ordered tracks within a playlist.

| Field        | Type      | Description                                         |
| ------------ | --------- | --------------------------------------------------- |
| `id`         | UUID (PK) | Auto-generated                                      |
| `playlistId` | UUID (FK) | Parent playlist (cascade delete)                    |
| `position`   | Int       | Order in playlist                                   |
| `title`      | String    | Track title                                         |
| `artist`     | String?   | Artist name                                         |
| `duration`   | Int?      | Duration in seconds                                 |
| `url`        | String?   | Stream URL                                          |
| `thumbnail`  | String?   | Cover art URL                                       |
| `platform`   | String    | Source: `youtube`, `spotify`, `soundcloud`, `local` |
| `platformId` | String?   | Platform-specific ID                                |
| `filePath`   | String?   | Local file path (for `local` platform)              |

#### PlayHistory

Log of every track played.

| Field         | Type        | Description                           |
| ------------- | ----------- | ------------------------------------- |
| `id`          | UUID (PK)   | Auto-generated                        |
| `guildId`     | String (FK) | Guild where it was played             |
| `userId`      | String      | User who requested it                 |
| `title`       | String      | Track title                           |
| `artist`      | String?     | Artist name                           |
| `duration`    | Int?        | Duration in seconds                   |
| `url`         | String?     | Stream URL                            |
| `platform`    | String      | Source platform                       |
| `playedAt`    | DateTime    | When playback started                 |
| `completedAt` | DateTime?   | When playback ended (null if skipped) |

#### QueueSnapshot

Persists the queue state across bot restarts.

| Field             | Type        | Description                            |
| ----------------- | ----------- | -------------------------------------- |
| `id`              | UUID (PK)   | Auto-generated                         |
| `guildId`         | String (FK) | Guild this snapshot belongs to         |
| `currentTrackUrl` | String?     | URL of the currently playing track     |
| `currentPosition` | Int         | Seek position in seconds               |
| `volume`          | Int         | Volume level (0-100)                   |
| `loopMode`        | String      | `off`, `track`, or `queue`             |
| `tracks`          | String      | JSON-serialized array of Track objects |

#### UserPreferences

Per-user per-guild preferences.

| Field      | Type        | Description               |
| ---------- | ----------- | ------------------------- |
| `id`       | UUID (PK)   | Auto-generated            |
| `guildId`  | String (FK) | Guild                     |
| `userId`   | String      | Discord user ID           |
| `language` | String      | Preferred language (`en`) |
| `volume`   | Int         | Preferred volume (0-100)  |

#### TrackCache

Caches track metadata to avoid repeated lookups.

| Field        | Type      | Description                    |
| ------------ | --------- | ------------------------------ |
| `id`         | UUID (PK) | Auto-generated                 |
| `platform`   | String    | Source platform                |
| `platformId` | String    | Platform-specific track ID     |
| `title`      | String    | Cached title                   |
| `artist`     | String?   | Cached artist                  |
| `duration`   | Int?      | Cached duration                |
| `url`        | String?   | Cached stream URL              |
| `thumbnail`  | String?   | Cached cover art               |
| `metadata`   | String?   | Additional JSON metadata       |
| `lastUsed`   | DateTime  | Last access time (for cleanup) |

### Database Repositories

Located in `packages/bot/src/database/repositories/`:

| Repository             | Description                                                   |
| ---------------------- | ------------------------------------------------------------- |
| `GuildRepository`      | Find/create guilds, update guild settings                     |
| `PlaylistRepository`   | Full CRUD for playlists and tracks, with position reordering  |
| `HistoryRepository`    | Record plays, get recently played (distinct), get most played |
| `QueueRepository`      | Save/restore queue snapshots as JSON                          |
| `TrackCacheRepository` | Upsert track metadata, cleanup old entries                    |

### Database Commands

```bash
pnpm db:generate   # Regenerate Prisma client after schema changes
pnpm db:push       # Push schema to SQLite (no migration history)
pnpm db:migrate    # Create and apply a migration
pnpm db:studio     # Open Prisma Studio web GUI
```

---

## Music Extractors

Extractors are registered in `packages/bot/src/extractors/index.ts` via `registerExtractors(player)`.

### Supported Platforms

| Platform    | Extractor                | Class Name               | How It Works                                                                  |
| ----------- | ------------------------ | ------------------------ | ----------------------------------------------------------------------------- |
| YouTube     | `YouTubeExtractor.ts`    | `CustomYouTubeExtractor` | Direct streaming via youtubei.js. Primary playback engine.                    |
| Spotify     | `SpotifyExtractor.ts`    | `SpotifyExtractor`       | Resolves Spotify metadata, finds matching YouTube stream. No Premium needed.  |
| SoundCloud  | `SoundCloudExtractor.ts` | `SoundCloudExtractor`    | Custom extractor for SoundCloud search and streaming.                         |
| Apple Music | `AppleMusicExtractor.ts` | `AppleMusicExtractor`    | Resolves Apple Music metadata, bridges to YouTube for streaming.              |
| Local files | `LocalExtractor.ts`      | `LocalExtractor`         | Local file paths and Discord attachments. ID3 tag parsing via music-metadata. |
| Auto        | discord-player routing   | --                       | Automatically detects platform from URL or searches YouTube.                  |

Additionally, `AttachmentExtractor` from `@discord-player/extractor` is registered for handling Discord message attachments.

### Platform Detection in Search

When searching via the API or `/search` command:

```typescript
case 'youtube':    queryType = QueryType.YOUTUBE_SEARCH
case 'spotify':    queryType = QueryType.SPOTIFY_SEARCH
case 'soundcloud': queryType = QueryType.SOUNDCLOUD_SEARCH
default:           queryType = QueryType.AUTO
```

### Spotify Setup (Optional)

To enable Spotify search, set these in `.env`:

```env
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
```

Get credentials from the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard). Spotify tracks are resolved to YouTube streams for playback -- no Spotify Premium required.

---

## Local Music

The `LocalMusicService` (`packages/bot/src/services/LocalMusicService.ts`) handles local file playback.

### Supported Formats

**Audio:** `.mp3`, `.flac`, `.wav`, `.ogg`, `.m4a`, `.aac`, `.wma`, `.opus`

**Video:** `.mp4`, `.mkv`, `.avi`, `.mov`, `.flv`, `.ogv`, `.3gp`, `.webm`

### Features

- Recursive folder scanning
- ID3 tag extraction via `music-metadata` (title, artist, album, duration)
- Falls back to filename when metadata is unavailable
- Search by title, artist, or filename
- Configurable via `MUSIC_FOLDER_PATH` env var

### How Local Files Are Played

1. **Via Discord**: Upload audio files with `/play` -- uses `AttachmentExtractor`
2. **Via API upload**: Upload through `/api/upload/single`, then play via `/api/music/play` with `source: "local"`
3. **Via folder scan**: Set `MUSIC_FOLDER_PATH`, files are discovered and searchable

---

## State Coordination

The bot supports multi-instance coordination for high availability. This is managed by `StateCoordinator` in `packages/bot/src/state/`.

### How It Works

1. Each instance publishes a presence message to a Discord text channel (`STATE_CHANNEL_ID`)
2. Instances send heartbeats every 15 seconds
3. A PING/PONG protocol detects which instances are online
4. The `/set-active` command selects which instance handles playback

### State Services

```
packages/bot/src/state/
├── IStateService.ts         # State service interface
├── StateCoordinator.ts      # Multi-instance coordination
├── channel/
│   └── ChannelStateService.ts  # Discord channel-based state
├── factory.ts               # State service factory
└── schema.ts                # State schema definitions
```

---

## Project Structure

```
packages/bot/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── data/                  # SQLite database (gitignored)
├── src/
│   ├── index.ts               # Entry point: Express + WebSocket + bot startup
│   ├── bot.ts                 # Discord client setup, player init, command handling
│   ├── commands/              # 26 slash command files
│   │   ├── play.ts            # Play music (multi-platform)
│   │   ├── search.ts          # Search with platform selection
│   │   ├── playlist.ts        # Playlist CRUD
│   │   ├── history.ts         # Play history
│   │   ├── queue.ts           # Queue display
│   │   ├── volume.ts          # Volume control
│   │   └── ...                # 20 more commands
│   ├── database/
│   │   ├── client.ts          # Prisma singleton
│   │   ├── generated/         # Generated Prisma client
│   │   └── repositories/      # Data access layer
│   ├── extractors/
│   │   ├── index.ts           # Platform extractor registration
│   │   ├── YouTubeExtractor.ts
│   │   ├── SpotifyExtractor.ts
│   │   ├── SoundCloudExtractor.ts
│   │   ├── AppleMusicExtractor.ts
│   │   └── LocalExtractor.ts
│   ├── helpers/
│   │   ├── commands/          # CommandContext, CommandRegistry, Discord integration
│   │   ├── discord/           # Player setup, event handling
│   │   ├── logger/            # Pino logging with rotation
│   │   ├── status/            # Player state manager
│   │   ├── websocket.ts       # WebSocket manager
│   │   ├── expressRouter.ts   # Route factory
│   │   ├── fileManager.ts     # File management utilities
│   │   ├── fileUpload.ts      # Multer upload handling
│   │   ├── ytdlp.ts           # yt-dlp integration
│   │   └── errorHandler.ts    # Global error handling
│   ├── routes/
│   │   ├── auth.ts            # /api/auth -- Discord OAuth2 + JWT
│   │   ├── channels.ts        # /api/channels -- Discord channel messages
│   │   ├── commands.ts        # /api/commands endpoints
│   │   ├── music.ts           # /api/music endpoints
│   │   ├── playlists.ts       # /api/playlists -- Playlist CRUD
│   │   ├── logs.ts            # /api/logs endpoints
│   │   └── upload.ts          # /api/upload endpoints
│   ├── services/
│   │   └── LocalMusicService.ts  # Local file scanning + metadata
│   ├── state/                 # Multi-instance state coordination
│   └── types/                 # TypeScript type definitions
├── .env                       # Environment variables
├── package.json
├── prisma.config.ts           # Prisma configuration
└── tsconfig.json
```
