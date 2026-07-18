# Dual-target UI - Tauri + Browser

**Status:** Approved
**Date:** 2026-04-24
**Owner:** Christopher van Rooyen

## Goal

Run the same `packages/desktop` React UI in two environments:

1. **Tauri** - the existing desktop app, unchanged user experience.
2. **Browser** - served same-origin from the Express bot, usable from `http://localhost:3000` locally and from an HTTPS origin when the bot is deployed behind a real domain.

No feature loss in Tauri. Browser mode accepts graceful degradation for purely-local-machine features (OS drag-drop, tray, deep-link callback).

## Scope

- Works on localhost for dev (Vite HMR via proxy).
- Works in prod same-origin (Express serves built SPA at `/`, API at `/api/*`).
- Works over HTTPS on a real domain (configurable public origin for the OAuth redirect and for the app origin the callback redirects back to).

## Non-goals

- Mobile targets, PWA installability, service workers.
- HttpOnly cookie auth (revisitable later; deliberately using `localStorage` + Bearer now).
- Rewriting the local-library scan as a client-side web feature; in web mode the bot scans its own filesystem (path-picker UI) because that's the process that plays the files.
- Third-party origin hosting (web UI must be served from the same origin as the API).

## Architecture

### Platform abstraction

All Tauri API usage moves behind a thin module at `packages/desktop/src/platform/`. The UI calls the abstraction; the abstraction picks an implementation at runtime.

```
packages/desktop/src/platform/
├── index.ts            # exports `platform` facade + capability flags
├── detect.ts           # isTauri() - checks window.__TAURI_INTERNALS__
├── window.ts           # minimize/toggleMaximize/close/hide (noop/hidden on web)
├── shell.ts            # openExternal(url) - tauri shell.open | window.open(url, '_blank')
├── dragDrop.ts         # registerDragDropHandler - Tauri onDragDropEvent | HTML5 drop
├── filePicker.ts       # pickFolder() - Tauri dialog | no-op / prompt fallback
└── authFlow.ts         # startOAuth(): Tauri = open external + deep-link listener; web = full-page redirect
```

Capability flags:

```ts
export const platform = {
  isTauri: isTauri(),
  canMinimizeToTray: isTauri(),
  canDragOsFiles: isTauri(), // HTML5 fallback still works for plain files
  canPickClientFolder: isTauri(), // Tauri-only dialog for an actual path
  showCustomTitlebar: isTauri(), // browser uses native window chrome
};
```

Consumer changes (one-liner summary; full list in implementation plan):

- `App.tsx` - move the deep-link `useEffect` into `platform/authFlow.ts`; `App.tsx` becomes shell-agnostic.
- `TitleBar.tsx` - wrap return in `if (!platform.showCustomTitlebar) return null;` and route button handlers through `platform.window`. The `pt-9` top padding in the layout also becomes conditional.
- `DropZone.tsx` - keep the dual-mode it already has, but read `platform.canDragOsFiles` instead of inline `__TAURI_INTERNALS__` checks.
- `LibraryPage.tsx` + `useBotStore.ts` - the `scan_music_folder` / `watch_folder` / `resolve_dropped_paths` / `is_directory` invokes move behind `platform.library.scan(path)` etc. Tauri implementation calls `invoke(...)`; web implementation calls new `/api/library/*` HTTP endpoints that do the same work server-side. File watching is Tauri-only - web mode falls back to manual rescan.
- `useBotStore.connectToBot` - calls `platform.authFlow.start()` instead of `shell.open` + deep-link listener.
- `lib/api.ts` - `baseUrl` becomes runtime-resolved (see §Runtime config).

### Auth flow (dual-path callback)

State param carries the client kind so the callback knows how to deliver the token. No duplicate JWT logic.

**Tauri:**

1. `platform.authFlow.start()` → `GET /api/auth/discord?client=tauri`.
2. Server returns Discord auth URL with `state` encoding `{client: 'tauri', nonce}` (signed JWT).
3. Tauri calls `shell.open(authUrl)`.
4. Discord → `GET /api/auth/callback?code=...&state=...`.
5. Server verifies state, exchanges code, issues JWT, responds with HTML that sets `window.location.href = "downunder://auth?token=..."`.
6. Deep-link handler (now in `platform/authFlow.ts`) stores token in `localStorage` and connects.

**Web:**

1. `platform.authFlow.start()` → `GET /api/auth/discord?client=web`.
2. Server returns Discord auth URL with `state` encoding `{client: 'web', nonce, origin}`. `origin` is `window.location.origin` sent as a query param.
3. Browser navigates to the auth URL.
4. Discord → `GET /api/auth/callback?code=...&state=...`.
5. Server verifies state, exchanges code, issues JWT, `302 ${origin}/#/auth/callback?token=<jwt>`.
6. New SPA route `/auth/callback` reads `?token=`, stores in `localStorage`, `history.replaceState`s the token out of the URL, navigates to `/`.

**State signing:** `jsonwebtoken` is already a dep - sign `{client, nonce, origin?, exp: 10min}` with `JWT_SECRET`. Prevents attackers from tampering with `client` to redirect the token.

**Token storage + transport:** unchanged. `localStorage['downunder_auth_token']`, `Authorization: Bearer` header.

### Static serving + same-origin hosting

`packages/bot/src/index.ts` gains a static/SPA-fallback tail after all API routes. Development uses Vite dev server (unchanged); production serves `packages/desktop/dist/`.

```ts
// After all /api/* routes.
if (process.env.NODE_ENV === 'production') {
  const spaDir = process.env.SPA_DIST_DIR ?? path.resolve(__dirname, '..', '..', 'desktop', 'dist'); // dist-relative fallback
  app.use(express.static(spaDir, { index: false }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/ws')) return next();
    res.sendFile(path.join(spaDir, 'index.html'));
  });
}
```

CORS stays open in dev (Vite proxy handles it); in prod, same-origin means CORS is a no-op.

### Runtime config

The API client picks its base URL at import time:

```ts
// packages/desktop/src/lib/api.ts
const defaultBase =
  typeof window !== 'undefined' && !('__TAURI_INTERNALS__' in window)
    ? window.location.origin // web: same-origin
    : (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'); // tauri dev + prod
let baseUrl = defaultBase;
```

Similarly for WS: `new URL('/ws', baseUrl).toString().replace(/^http/, 'ws')`.

**Env vars introduced:**

| Var                    | Where         | Purpose                                                                                                                                         |
| ---------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`    | desktop build | Tauri base URL override (default `http://localhost:3000`).                                                                                      |
| `PUBLIC_APP_ORIGIN`    | bot runtime   | Trusted origin for web-mode OAuth callback redirects. Falls back to the request's `origin` header (validated against a regex allowlist if set). |
| `SPA_DIST_DIR`         | bot runtime   | Optional override for static SPA dir.                                                                                                           |
| `DISCORD_REDIRECT_URI` | existing      | Unchanged. Operator must register this URI in the Discord developer portal.                                                                     |

**Port-mismatch fix (incidental):** current `vite.config.ts` proxies to `:3001` while `api.ts` and the bot default to `:3000`. Unify on `:3000` (matches the bot default) and document how to override via `VITE_DEV_PROXY_TARGET` if someone runs the bot on a non-default port.

### CSP

Current `tauri.conf.json` CSP hardcodes `localhost:*`. Broaden to match the runtime origin, but this only applies to Tauri (its webview enforces it). Web mode's CSP is an Express response header - new middleware:

```ts
app.use((_req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
      "connect-src 'self' ws: wss:; " +
      "img-src 'self' https: data:; " +
      "media-src 'self' blob:; " +
      "style-src 'self' 'unsafe-inline';",
  );
  next();
});
```

Tauri CSP: add `https://discord.com` to `img-src` (avatar URLs) - already works via `https:` but be explicit. The rest stays.

### Web-mode library scan API

New `packages/bot/src/routes/library.ts`, mounted at `/api/library`:

- `POST /api/library/scan` `{ path }` → returns tracks (same shape as the existing Rust `scan_music_folder` result).
- `POST /api/library/resolve` `{ paths }` → same shape as `resolve_dropped_paths`.
- `POST /api/library/is-directory` `{ path }` → `{ isDirectory: boolean }`.
- Auth: `requireAuth`. Access control: operator-only - check `auth.userId === 'local'` OR a `LIBRARY_ALLOWED_USERS` env var. Filesystem paths are sensitive; we don't expose arbitrary path reads to every Discord user.
- Path validation: resolve + ensure inside a configured `LIBRARY_ROOTS` allowlist (defaults to the bot's own music dir). Reject paths outside.

Tauri path uses the existing `invoke`s; the HTTP endpoints are web-only. `LibraryPage.tsx` picks via `platform.library.*`.

File watching (`watch_folder` + emitted events) stays Tauri-only. Web mode shows a "Rescan" button.

## Component responsibilities

| Component               | Tauri                         | Web                                                                                    |
| ----------------------- | ----------------------------- | -------------------------------------------------------------------------------------- |
| `TitleBar`              | renders                       | returns `null`                                                                         |
| app layout `pt-9`       | applied                       | `pt-0`                                                                                 |
| `DropZone`              | Tauri DnD event stream        | HTML5 drop with `File` objects (limited to files the user already owns; no full paths) |
| OAuth start             | `shell.open` external         | full-page redirect                                                                     |
| OAuth callback delivery | `downunder://auth?token=`     | `/#/auth/callback?token=` (same-origin)                                                |
| Library scan            | `invoke('scan_music_folder')` | `POST /api/library/scan`                                                               |
| Folder picker           | `@tauri-apps/plugin-dialog`   | text input / browse-on-server modal                                                    |
| Folder watch            | `watch_folder` + events       | manual rescan button                                                                   |
| Window controls         | Tauri window API              | absent                                                                                 |
| Minimize to tray        | Tauri `hide()`                | absent                                                                                 |

## Error handling

- `platform.authFlow.start()` rejects with a typed error on network failure; caller shows a toast.
- Web callback route handles `?error=...` query param from Discord and routes to `/#/auth/error`.
- Library scan endpoint returns `403` for paths outside `LIBRARY_ROOTS`; UI shows "path not allowed".
- Everywhere else, the existing error flow (toast + `onAuthFailure` on 401/403) is unchanged.

## Testing

- **Type-check** both packages (`cd packages/bot && tsc --noEmit` and `cd packages/desktop && tsc --noEmit`).
- **Bot unit test** for the new state-signing helper in `auth.ts` (sign then verify, tamper round-trip fails).
- **Bot unit test** for the library-scan path validation (inside allowlist accepts; outside rejects).
- **Manual Tauri smoke**: OAuth end-to-end, library scan, drag-drop, minimize-to-tray.
- **Manual browser smoke**: run `pnpm --filter discord-bot dev`, build the SPA, hit `http://localhost:3000/`, do OAuth end-to-end, play a track, confirm the titlebar is absent and the layout fills the window.
- **Manual HTTPS smoke** (deferred): deploy bot with `PUBLIC_APP_ORIGIN=https://example.com`, register the redirect URI in Discord, confirm OAuth.

## Rollout

One branch, one merge. No feature flag - the detection is runtime, both paths coexist.

## Open questions

None at plan-approval time. If the path-validation allowlist proves too restrictive in practice, we relax it in a follow-up.
