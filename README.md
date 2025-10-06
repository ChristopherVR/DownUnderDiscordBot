# Discord Bot Dashboard v3

- Tailwind v4 + @tailwindcss/postcss configured
- shadcn-like UI primitives bundled (no generator required)
- Light/Dark theme toggle via next-themes
- Polished Player, Logs, Commands, Instances, and Connections
- State service backed by a shared text channel; tolerates **stale messages** and prefers the newest docVersion

## Dev

### Server

```bash
cd server
pnpm i
pnpm dev
```

### Client

```bash
cd client
pnpm i
pnpm dev
```

Build client then let server serve `/client/dist` in production.
