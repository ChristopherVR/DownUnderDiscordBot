# Down Under Discord Bot

A multi-platform Discord music bot with a Tauri desktop dashboard, SQLite persistence, and Azure CI/CD infrastructure.

## Features

- **Multi-platform music** -- YouTube, Spotify (via YouTube bridge), SoundCloud, and local files
- **27 slash commands** -- Full playback control, playlists, search, history, queue management
- **Tauri desktop app** -- Spotify-inspired dark theme dashboard to control the bot from your desktop
- **Real-time sync** -- WebSocket connection keeps the dashboard in sync with bot state
- **SQLite database** -- Playlists, play history, queue snapshots, user preferences, track cache
- **REST API** -- 40+ endpoints for player control, queue, playlists, search, file uploads
- **Azure deployment** -- Bicep IaC, Docker containerization, GitHub Actions CI/CD
- **Local music** -- Scan folders, parse ID3 tags, search by title/artist

## Architecture

```
DownUnderDiscordBot/
├── packages/
│   ├── bot/          # Discord bot + Express API server (Node.js/TypeScript)
│   ├── desktop/      # Tauri desktop app (Rust + React)
│   └── shared/       # Shared types, localization, contracts
├── infrastructure/
│   ├── docker/       # Dockerfile, docker-compose
│   └── azure/bicep/  # Azure IaC templates
└── .github/workflows/  # CI, bot deploy, desktop releases
```

The **bot** runs as a standalone Node.js process that connects to Discord and exposes a REST + WebSocket API on port 3001. The **desktop app** connects to the bot's API -- it doesn't run the bot itself. This means you can run the bot on a server and control it from any machine with the desktop app.

## Quick Start

### Prerequisites

- [Node.js 22+](https://nodejs.org/)
- [pnpm 10+](https://pnpm.io/) (`corepack enable && corepack prepare pnpm@latest --activate`)
- [FFmpeg](https://ffmpeg.org/) (for audio processing)
- [Rust](https://rustup.rs/) (only needed to build the desktop app)
- A [Discord bot token](https://discord.com/developers/applications)

### 1. Clone and install

```bash
git clone https://github.com/your-username/DownUnderDiscordBot.git
cd DownUnderDiscordBot
pnpm install
```

### 2. Configure environment

Copy the example and fill in your values:

```bash
cp packages/bot/.env.example packages/bot/.env
```

At minimum you need:

```env
CLIENT_TOKEN=your-discord-bot-token
GUILD_ID=your-discord-server-id
PORT=3001
DATABASE_URL=file:./data/bot.db
FFMPEG_PATH=ffmpeg
```

See [Bot Documentation](docs/bot.md#environment-variables) for all available variables.

### 3. Set up the database

```bash
pnpm db:push
```

### 4. Build and run the bot

```bash
pnpm build
pnpm start
```

Or for development with hot reload:

```bash
pnpm dev
```

### 5. Run the desktop app (optional)

```bash
pnpm dev:desktop
```

## Documentation

| Document | Description |
|----------|-------------|
| [Bot Documentation](docs/bot.md) | Commands, API endpoints, WebSocket protocol, database schema, extractors |
| [Desktop App Documentation](docs/desktop.md) | Tauri setup, React frontend, stores, pages, configuration |
| [Infrastructure & CI/CD](docs/infrastructure.md) | Docker, Azure Bicep, GitHub Actions workflows, deployment |

## Scripts Reference

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start bot in development mode with hot reload |
| `pnpm dev:desktop` | Start desktop app in development mode |
| `pnpm build` | Build shared package and bot |
| `pnpm build:all` | Build shared, bot, and desktop |
| `pnpm start` | Run the bot in production mode |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all packages |
| `pnpm format` | Format all files with Prettier |
| `pnpm db:push` | Push Prisma schema to SQLite |
| `pnpm db:studio` | Open Prisma Studio (database GUI) |
| `pnpm db:migrate` | Run database migrations |
| `pnpm health-check` | Check if the bot API is running |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Bot runtime | Node.js 22, TypeScript, discord.js, discord-player |
| Music sources | youtubei.js, spotify-web-api-node, soundcloud.ts, music-metadata |
| API server | Express.js, WebSocket (ws) |
| Database | SQLite via Prisma ORM |
| Desktop shell | Tauri v2 (Rust) |
| Desktop UI | React 19, Tailwind CSS, Zustand, Framer Motion, Radix UI |
| Infrastructure | Docker, Azure Container Apps, Azure Bicep |
| CI/CD | GitHub Actions |

## License

MIT
