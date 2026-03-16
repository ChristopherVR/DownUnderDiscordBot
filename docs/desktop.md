# Desktop App Documentation

The desktop app (`packages/desktop/`) is a Tauri v2 application with a Rust backend shell and a React frontend. It provides a Spotify-inspired dashboard to control the Discord bot remotely.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [Rust Backend](#rust-backend)
- [React Frontend](#react-frontend)
- [State Management](#state-management)
- [Communication Layer](#communication-layer)
- [Theming and Design](#theming-and-design)
- [Building for Production](#building-for-production)
- [Project Structure](#project-structure)

---

## Overview

The desktop app is a standalone native application that connects to a running bot instance. It does **not** run the bot -- it communicates with it via WebSocket (real-time state) and REST API (commands). This design means:

- The bot can run on a server or another machine
- Multiple users can connect to the same bot
- The dashboard works with or without the bot running (shows disconnected state)

---

## Getting Started

### Prerequisites

- [Rust](https://rustup.rs/) (for building the Tauri shell)
- [Node.js 22+](https://nodejs.org/)
- [pnpm 10+](https://pnpm.io/)

### Development

```bash
# From the repo root
pnpm dev:desktop
```

This starts:

1. Vite dev server on `http://localhost:5173` (React frontend)
2. Tauri dev window pointing to the Vite server

The Vite dev server proxies `/api` requests to `http://localhost:3001` (the bot) and `/ws` WebSocket connections.

### Without Rust (Frontend Only)

If you don't have Rust installed, you can still develop the frontend:

```bash
cd packages/desktop
pnpm dev
```

This starts just the Vite dev server. The UI will work but Tauri-specific features (file scanning, config persistence) won't be available.

---

## Architecture

```
packages/desktop/
├── src-tauri/          # Rust backend (Tauri shell)
│   ├── src/
│   │   ├── main.rs     # Tauri app builder, registers commands
│   │   ├── commands.rs # Bot connection + health check IPC
│   │   ├── config.rs   # App config persistence (JSON file)
│   │   └── file_scanner.rs  # Local music folder scanning
│   ├── Cargo.toml      # Rust dependencies
│   └── tauri.conf.json # Tauri app configuration
└── src/                # React frontend
    ├── main.tsx        # React entry point
    ├── App.tsx         # Root component with router + layout
    ├── stores/         # Zustand state management
    ├── pages/          # Route pages
    ├── components/     # Reusable UI components
    ├── lib/            # Utilities, API client, WebSocket service
    └── styles/         # Global CSS
```

---

## Rust Backend

The Tauri Rust backend provides native capabilities that aren't available in a browser context.

### IPC Commands (`src-tauri/src/commands.rs`)

| Command          | Arguments                 | Returns         | Description                                  |
| ---------------- | ------------------------- | --------------- | -------------------------------------------- |
| `connect_to_bot` | `host: String, port: u16` | `BotConnection` | Tests HTTP connection to bot, returns status |
| `get_bot_status` | `host: String, port: u16` | `JSON`          | Fetches full bot state from `/api/state`     |
| `health_check`   | `host: String, port: u16` | `BotStatus`     | Quick health check (ok/message)              |

### File Scanner (`src-tauri/src/file_scanner.rs`)

| Command                     | Arguments      | Returns           | Description                                     |
| --------------------------- | -------------- | ----------------- | ----------------------------------------------- |
| `scan_music_folder`         | `path: String` | `Vec<LocalTrack>` | Recursively scan folder for audio files         |
| `get_default_music_folders` | --             | `Vec<String>`     | Get platform-specific default music directories |

Scanned tracks include ID3 metadata (title, artist, album, duration) parsed via the `audiotags` crate.

**Supported formats:** `.mp3`, `.flac`, `.wav`, `.ogg`, `.m4a`, `.aac`, `.wma`, `.opus`

### Config Persistence (`src-tauri/src/config.rs`)

| Command       | Arguments           | Returns     | Description                                        |
| ------------- | ------------------- | ----------- | -------------------------------------------------- |
| `get_config`  | --                  | `AppConfig` | Load config from disk (creates default if missing) |
| `save_config` | `config: AppConfig` | `()`        | Write config to disk                               |

Config is stored at `~/.config/discord-music-bot/config.json` (or platform equivalent).

**AppConfig fields:**

```json
{
  "bot_host": "localhost",
  "bot_port": 3001,
  "music_folders": [],
  "theme": "dark",
  "language": "en",
  "auto_connect": true
}
```

### Tauri Configuration (`tauri.conf.json`)

| Setting       | Value                                            |
| ------------- | ------------------------------------------------ |
| App name      | Discord Music Bot                                |
| Version       | 2.0.0                                            |
| Bundle ID     | `com.downunder.discord-music-bot`                |
| Window size   | 1280x800 (min 900x600)                           |
| CSP           | Allows `self`, `localhost` WS/HTTP, HTTPS images |
| Build targets | Windows, macOS (universal), Linux                |

### Rust Dependencies

| Crate                  | Purpose                              |
| ---------------------- | ------------------------------------ |
| `tauri` v2             | Desktop app framework                |
| `serde` / `serde_json` | Serialization                        |
| `reqwest`              | HTTP client for bot API              |
| `walkdir`              | Recursive directory traversal        |
| `audiotags`            | ID3 tag parsing                      |
| `dirs`                 | Platform-specific config directories |

---

## React Frontend

### Pages

The app has 5 main pages, accessible via the sidebar navigation.

#### Now Playing (`src/pages/NowPlayingPage.tsx`)

Full-screen view of the currently playing track.

- Large album art (rotates when playing, circular when animated, square when paused)
- Track title and artist
- Progress bar with elapsed/total time
- Play/pause, skip, and favorite buttons
- Animated transitions between tracks (Framer Motion)
- Shows "Not connected" or "Nothing playing" states when appropriate

#### Queue (`src/pages/QueuePage.tsx`)

Displays the current queue with management actions.

- Currently playing track highlighted at the top (green accent)
- Numbered list of upcoming tracks with thumbnail, title, artist, platform icon, and duration
- Remove button per track (visible on hover)
- Shuffle and Clear All buttons
- Drag handle icons (visual indicator for future drag-to-reorder)

#### Search (`src/pages/SearchPage.tsx`)

Unified search across all supported platforms.

- Search input with Spotify-style rounded pill design
- Platform filter tabs: All, YouTube, Spotify, SoundCloud
- Results list with play and add-to-queue actions per result
- Loading spinner during search
- Play button overlay on thumbnail hover

#### Library (`src/pages/LibraryPage.tsx`)

Three-tab view for your music collection.

- **Playlists** -- Grid of user-created playlists with play button overlay. Cards show name and track count.
- **History** -- List of recently played tracks with play count. Replay or add to queue.
- **Local Files** -- Files from configured music folders with title, artist, and duration.

#### Settings (`src/pages/SettingsPage.tsx`)

Bot connection configuration.

- Host and port input fields
- Guild ID field
- Connection status indicator (green/red)
- Save & Reconnect button
- Quick Reconnect button
- About section with version info

### Components

#### Sidebar (`src/components/Sidebar.tsx`)

Fixed left sidebar with Spotify-style dark background.

- Collapsible (56px collapsed, 224px expanded)
- Logo and app name at the top
- Navigation links: Now Playing, Queue, Search, Library, Settings
- Active route highlighted with muted background
- Connection status at the bottom (Wifi/WifiOff icon)
- Collapse/expand toggle button

#### PlayerBar (`src/components/PlayerBar.tsx`)

Persistent bottom bar (80px) that's always visible regardless of the active page.

**Left section (track info):**

- Thumbnail (56x56)
- Track title and artist (truncated)

**Center section (controls):**

- Shuffle, Previous, Play/Pause, Next, Loop buttons
- Seek bar with current position and total duration
- Play/Pause is a white circle button; loop turns green when active

**Right section (volume):**

- Mute/unmute toggle
- Volume slider (range input with green accent)

**Seek bar behavior:**

- Ticks forward in real-time while playing (1s interval)
- Click anywhere on the bar to seek
- Pauses local tick while dragging

---

## State Management

### Zustand Store (`src/stores/useBotStore.ts`)

Single store manages all application state. Key slices:

**Connection state:**

```typescript
{
  host: string; // Bot hostname (default: 'localhost')
  port: number; // Bot port (default: 3001)
  connected: boolean; // WebSocket connected
  botOnline: boolean; // Bot process responding
  guildId: string; // Active Discord guild
}
```

**Player state:**

```typescript
{
  isPlaying: boolean
  currentTrack: Track | null
  position: number     // Current position in seconds
  duration: number     // Total duration in seconds
  volume: number       // 0-100
  loop: 'off' | 'track' | 'queue'
  queue: Track[]
}
```

**Track type:**

```typescript
{
  title: string
  artist?: string
  duration?: number
  url?: string
  thumbnail?: string
  platform?: string
  filePath?: string
  requestedBy?: string
}
```

**Actions:**
All player actions (`play`, `pause`, `resume`, `stop`, `skip`, `seek`, `setVolume`, `setLoop`, `addToQueue`, `removeFromQueue`, `clearQueue`, `shuffleQueue`) call the REST API and optimistically update local state. Real state comes back via WebSocket events.

**Search:**
`search(query, platform?)` calls the API and stores results in `searchResults[]`. `clearSearch()` resets.

---

## Communication Layer

### WebSocket Service (`src/lib/ws.ts`)

`WebSocketService` class with singleton export (`wsService`).

- Connects to `ws://host:port/ws`
- Auto-reconnects with exponential backoff (1s, 2s, 4s, ... up to 30s, max 20 attempts)
- Event-based: `wsService.on('player_state', handler)` returns an unsubscribe function
- Emits `connection` event on connect/disconnect
- Parses JSON messages and routes by `type` field
- `send(data)` serializes and sends when connected

**Events handled by the store:**

- `connection` -- Updates `connected` status
- `player_state` -- Merges into player state
- `queue_update` -- Updates queue array
- `track_started` -- Sets new current track, resets position
- `bot_status` -- Updates `botOnline`

### REST API Client (`src/lib/api.ts`)

Typed API client with configurable base URL.

```typescript
import { api, setApiBaseUrl } from '@/lib/api';

setApiBaseUrl('192.168.1.10', 3001);

await api.play('never gonna give you up', 'youtube');
await api.pause();
await api.search('lofi hip hop', 'spotify');
const queue = await api.getQueue();
```

All methods throw on non-2xx responses. The store catches errors silently since real state comes via WebSocket.

---

## Theming and Design

### Color Palette

The app uses a Spotify-inspired dark theme defined in Tailwind and CSS variables.

**Tailwind colors** (`tailwind.config.cjs`):

| Token                 | Value     | Usage                                      |
| --------------------- | --------- | ------------------------------------------ |
| `spotify-green`       | `#1DB954` | Primary accent, active states, play button |
| `spotify-green-light` | `#1ED760` | Hover state for green elements             |
| `spotify-black`       | `#191414` | Deepest background                         |
| `spotify-dark-gray`   | `#121212` | Main background                            |
| `spotify-gray`        | `#282828` | Card backgrounds, muted elements           |
| `spotify-light-gray`  | `#B3B3B3` | Secondary text                             |
| `spotify-white`       | `#FFFFFF` | Primary text                               |

**CSS variables** (`src/styles/globals.css`):

| Variable             | Value     | Usage             |
| -------------------- | --------- | ----------------- |
| `--background`       | `#121212` | Page background   |
| `--foreground`       | `#ffffff` | Primary text      |
| `--muted`            | `#282828` | Muted backgrounds |
| `--muted-foreground` | `#b3b3b3` | Secondary text    |
| `--accent`           | `#1DB954` | Accent color      |
| `--card`             | `#181818` | Card background   |
| `--card-hover`       | `#282828` | Card hover state  |
| `--border`           | `#333333` | Borders           |

### Typography

- Primary font: Inter (with system-ui and sans-serif fallbacks)
- Antialiased rendering enabled

### Custom Scrollbar

Styled WebKit scrollbar: 8px width, transparent track, `#555` thumb with `#777` hover.

### Animations

- `pulse-slow`: 3s pulse for loading states
- `spin-slow`: 8s rotation for album art
- Framer Motion page transitions (fade + slide)

---

## Building for Production

### Frontend Only (Web Build)

```bash
cd packages/desktop
pnpm build
```

Output in `packages/desktop/dist/`. This is what Tauri bundles into the native app.

### Full Tauri Build

```bash
cd packages/desktop
pnpm tauri build
```

This compiles the Rust backend and bundles the React frontend into a native installer:

- **Windows**: `.msi` and `.exe`
- **macOS**: `.dmg` and `.app`
- **Linux**: `.deb` and `.AppImage`

Build output goes to `packages/desktop/src-tauri/target/release/bundle/`.

### CI Build

The `release-desktop.yml` GitHub Actions workflow builds for all three platforms when you push a tag matching `v*`:

```bash
git tag v2.0.0
git push origin v2.0.0
```

This creates a draft GitHub Release with all platform installers attached.

---

## Project Structure

```
packages/desktop/
├── src-tauri/                    # Rust backend
│   ├── Cargo.toml                # Rust dependencies
│   ├── build.rs                  # Tauri build script
│   ├── tauri.conf.json           # App configuration (window, CSP, bundle)
│   └── src/
│       ├── main.rs               # Tauri app builder with command registration
│       ├── commands.rs           # IPC: connect_to_bot, get_bot_status, health_check
│       ├── config.rs             # IPC: get_config, save_config (JSON persistence)
│       └── file_scanner.rs       # IPC: scan_music_folder, get_default_music_folders
│
├── src/                          # React frontend
│   ├── main.tsx                  # ReactDOM render with BrowserRouter
│   ├── App.tsx                   # Layout: Sidebar + Routes + PlayerBar
│   ├── vite-env.d.ts             # Vite type declarations
│   │
│   ├── stores/
│   │   └── useBotStore.ts        # Zustand store (connection, player, search, actions)
│   │
│   ├── pages/
│   │   ├── NowPlayingPage.tsx    # Album art + track info + large controls
│   │   ├── QueuePage.tsx         # Queue list with manage actions
│   │   ├── SearchPage.tsx        # Multi-platform search + results
│   │   ├── LibraryPage.tsx       # Playlists / History / Local files tabs
│   │   └── SettingsPage.tsx      # Bot connection config
│   │
│   ├── components/
│   │   ├── Sidebar.tsx           # Collapsible navigation sidebar
│   │   └── PlayerBar.tsx         # Persistent bottom player controls
│   │
│   ├── lib/
│   │   ├── api.ts                # REST API client (all bot endpoints)
│   │   ├── ws.ts                 # WebSocket service (auto-reconnect, events)
│   │   └── utils.ts              # cn(), formatTime(), truncate(), platformIcon()
│   │
│   └── styles/
│       └── globals.css           # Tailwind directives + CSS variables + scrollbar
│
├── index.html                    # HTML entry point (dark theme)
├── package.json                  # Dependencies and scripts
├── vite.config.ts                # Vite config with Tauri optimizations + API proxy
├── tsconfig.json                 # TypeScript config with @/* path alias
├── tailwind.config.cjs           # Spotify color palette + custom animations
└── postcss.config.cjs            # PostCSS with Tailwind + Autoprefixer
```
