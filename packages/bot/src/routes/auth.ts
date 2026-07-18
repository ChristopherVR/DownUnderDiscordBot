import { Request, Response, Router } from 'express';
import type { NextFunction, Router as RouterType } from 'express';
import jwt from 'jsonwebtoken';
import type { Client, Guild } from 'discord.js';
import { createLogger } from '../helpers/logger.js';

const log = createLogger('auth');
const router: RouterType = Router();

const DISCORD_API = 'https://discord.com/api/v10';

const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    log.fatal('JWT_SECRET environment variable is required. Set it to a random string of at least 32 characters.');
    process.exit(1);
  }
  if (secret.length < 32) {
    log.warn(
      { length: secret.length },
      'JWT_SECRET is shorter than 32 characters; use a stronger secret in production',
    );
  }
  return secret;
})();

const JWT_EXPIRY = '7d';

// Auto-detect client ID from bot token if DISCORD_CLIENT_ID not explicitly set
function getClientIdFromToken(): string {
  const token = process.env.CLIENT_TOKEN || '';
  if (!token) return '';
  try {
    const base64 = token.split('.')[0];
    return Buffer.from(base64, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || getClientIdFromToken();
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
const DISCORD_REDIRECT_URI =
  process.env.DISCORD_REDIRECT_URI || `http://localhost:${process.env.PORT || 3000}/api/auth/callback`;

/** Trusted origin for web-mode post-auth redirects. Falls back to the origin
 *  of the inbound request during the OAuth start (captured into the signed
 *  state param), so single-host deployments work without configuration. */
const PUBLIC_APP_ORIGIN = process.env.PUBLIC_APP_ORIGIN || '';

/** Additional web origins allowed to receive the post-auth token redirect,
 *  beyond PUBLIC_APP_ORIGIN (which is always implicitly trusted). Required
 *  for multi-origin web deployments; an attacker-supplied `?origin=` that
 *  isn't in this set is dropped rather than trusted, since trusting it
 *  verbatim would let anyone redirect a freshly-minted JWT to their own
 *  site. */
const ALLOWED_WEB_ORIGINS = new Set(
  (process.env.ALLOWED_WEB_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);

/** Only trust `x-forwarded-*` headers when explicitly running behind a
 *  reverse proxy that overwrites them; otherwise a client could set them
 *  directly and redirect the post-auth token to an arbitrary host. */
const TRUST_PROXY = process.env.TRUST_PROXY === 'true';

function isAllowedWebOrigin(origin: string): boolean {
  if (origin === PUBLIC_APP_ORIGIN) return true;
  return ALLOWED_WEB_ORIGINS.has(origin);
}

type OAuthClientKind = 'tauri' | 'web';

interface OAuthStatePayload {
  client: OAuthClientKind;
  origin?: string;
  nonce: string;
}

function signOAuthState(payload: OAuthStatePayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '10m' });
}

function verifyOAuthState(raw: string): OAuthStatePayload | null {
  try {
    const decoded = jwt.verify(raw, JWT_SECRET) as OAuthStatePayload & { iat?: number; exp?: number };
    if (decoded.client !== 'tauri' && decoded.client !== 'web') return null;
    return { client: decoded.client, origin: decoded.origin, nonce: decoded.nonce };
  } catch {
    return null;
  }
}

function resolveCallbackOrigin(req: Request, stateOrigin?: string): string {
  if (PUBLIC_APP_ORIGIN) return PUBLIC_APP_ORIGIN;
  if (stateOrigin) return stateOrigin;
  // Last resort: reconstruct from request headers. x-forwarded-* is only
  // honored when TRUST_PROXY is set, since otherwise a client can set those
  // headers itself and redirect the post-auth token to a host of its choosing.
  const proto = (TRUST_PROXY && (req.headers['x-forwarded-proto'] as string)) || req.protocol;
  const host = (TRUST_PROXY && (req.headers['x-forwarded-host'] as string)) || req.headers.host;
  return `${proto}://${host}`;
}

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  global_name: string | null;
}

interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

interface TokenPayload {
  userId: string;
  username: string;
  avatar: string | null;
  accessToken: string;
}

/**
 * GET /api/auth/discord
 * Returns the Discord OAuth2 authorization URL. Accepts `?client=tauri|web`
 * (default: tauri) and `?origin=<url>` (used by web clients so the server
 * can redirect the token back to the SPA origin).
 */
router.get('/discord', (req: Request, res: Response) => {
  if (!DISCORD_CLIENT_ID) {
    return res.status(500).json({ error: 'Discord OAuth not configured' });
  }

  const client: OAuthClientKind = req.query.client === 'web' ? 'web' : 'tauri';
  const originParam = typeof req.query.origin === 'string' ? req.query.origin : undefined;
  const trustedOrigin = originParam && isAllowedWebOrigin(originParam) ? originParam : undefined;

  const state = signOAuthState({
    client,
    origin: client === 'web' ? trustedOrigin : undefined,
    nonce: Math.random().toString(36).slice(2),
  });

  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify guilds',
    state,
  });

  const url = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  res.json({ url });
});

/**
 * GET /api/auth/callback
 * Handles the Discord OAuth2 callback. Exchanges code for tokens,
 * fetches user info, creates JWT, and redirects to the Tauri app.
 */
router.get('/callback', async (req: Request, res: Response) => {
  const { code, state } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  // Default to tauri for backwards compatibility with pre-state-param clients.
  const parsedState = typeof state === 'string' ? verifyOAuthState(state) : null;
  const clientKind: OAuthClientKind = parsedState?.client ?? 'tauri';

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: DISCORD_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      log.error({ status: tokenResponse.status, err }, 'Discord token exchange failed');
      return res.status(401).json({ error: 'Failed to exchange authorization code' });
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      token_type: string;
      expires_in: number;
      refresh_token: string;
      scope: string;
    };

    // Fetch user info
    const userResponse = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userResponse.ok) {
      return res.status(401).json({ error: 'Failed to fetch user info' });
    }

    const user = (await userResponse.json()) as DiscordUser;

    // Create JWT
    const payload: TokenPayload = {
      userId: user.id,
      username: user.global_name ?? user.username,
      avatar: user.avatar,
      accessToken: tokenData.access_token,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    if (clientKind === 'web') {
      // Same-origin redirect back to the SPA. The app reads the token from the
      // URL, stores it, and replaces the history entry to scrub the token.
      const origin = resolveCallbackOrigin(req, parsedState?.origin);
      const redirectTo = `${origin}/#/auth/callback?token=${encodeURIComponent(token)}`;
      log.info({ userId: user.id, username: user.username, client: 'web' }, 'User authenticated');
      return res.redirect(302, redirectTo);
    }

    // Tauri path: HTML page that tries the deep-link and shows the token as
    // a fallback so the user can paste it manually if the deep-link fails.
    const redirectUrl = `downunder://auth?token=${encodeURIComponent(token)}`;
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Authentication Successful</title></head>
        <body style="background:#08080c;color:white;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
          <div style="text-align:center;">
            <h1 style="color:#1db954;">Authentication Successful</h1>
            <p>Redirecting to Down Under Bot...</p>
            <p style="color:#666;font-size:0.875rem;">If the app doesn't open automatically, copy this token:</p>
            <code style="background:#1a1a2e;padding:8px 16px;border-radius:8px;font-size:0.75rem;word-break:break-all;display:block;max-width:400px;margin:8px auto;">${token}</code>
            <script>
              window.location.href = "${redirectUrl}";
              setTimeout(() => {
                document.body.innerHTML += '<p style="color:#1db954;margin-top:16px;">You can close this window.</p>';
              }, 2000);
            </script>
          </div>
        </body>
      </html>
    `);
    log.info({ userId: user.id, username: user.username, client: 'tauri' }, 'User authenticated');
  } catch (err) {
    log.error({ err }, 'OAuth callback failed');
    res.status(500).json({ error: 'Authentication failed' });
  }
});

/**
 * GET /api/auth/user
 * Returns the authenticated user's Discord profile.
 * Requires Authorization: Bearer <jwt> header.
 */
router.get('/user', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;

    // Quick-connect users (local) don't have a Discord access token
    if (payload.userId === 'local' || !payload.accessToken) {
      const botUser = _botClient?.user;
      return res.json({
        id: payload.userId,
        username: botUser?.username ?? payload.username,
        discriminator: undefined,
        avatar: botUser?.displayAvatarURL?.() ?? null,
      });
    }

    // Fetch fresh user data from Discord
    const userResponse = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${payload.accessToken}` },
    });

    if (!userResponse.ok) {
      return res.status(401).json({ error: 'Discord token expired' });
    }

    const user = (await userResponse.json()) as DiscordUser;

    res.json({
      id: user.id,
      username: user.global_name ?? user.username,
      discriminator: user.discriminator,
      avatar: user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator || '0') % 5}.png`,
    });
  } catch (err) {
    log.warn({ err }, 'Auth verification failed');
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

/**
 * GET /api/auth/guilds
 * Returns the guilds the authenticated user is in.
 * Also cross-references with guilds the bot is in.
 */
router.get('/guilds', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;

    // Quick-connect users (local) — return bot's guild list directly
    if (payload.userId === 'local' || !payload.accessToken) {
      if (!_botClient) {
        return res.json({ guilds: [] });
      }
      const guilds = _botClient.guilds.cache.map((g: Guild) => ({
        id: g.id,
        name: g.name,
        icon: g.iconURL?.() ?? null,
        owner: false,
        botPresent: true,
      }));
      return res.json({ guilds });
    }

    // Fetch user's guilds
    const guildsResponse = await fetch(`${DISCORD_API}/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${payload.accessToken}` },
    });

    if (!guildsResponse.ok) {
      return res.status(401).json({ error: 'Discord token expired' });
    }

    const userGuilds = (await guildsResponse.json()) as DiscordGuild[];

    // Get bot's guilds (will be populated once the client reference is set)
    const botGuildIds = getBotGuildIds();

    // Return guilds with bot presence info
    const guilds = userGuilds
      .filter((g) => {
        // Only show guilds where the bot is present OR user has admin perms
        const perms = BigInt(g.permissions);
        const isAdmin = (perms & BigInt(0x8)) === BigInt(0x8);
        return botGuildIds.has(g.id) || isAdmin;
      })
      .map((g) => ({
        id: g.id,
        name: g.name,
        icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null,
        owner: g.owner,
        botPresent: botGuildIds.has(g.id),
      }));

    res.json({ guilds });
  } catch (err) {
    log.warn({ err }, 'Failed to fetch guilds');
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// Bot guild cache — set externally after bot starts
let _botGuildIds: Set<string> = new Set();
let _botClient: Client | null = null;

export function setBotGuildIds(ids: Set<string>): void {
  _botGuildIds = ids;
}

export function setBotClient(client: Client): void {
  _botClient = client;
}

function getBotGuildIds(): Set<string> {
  return _botGuildIds;
}

/**
 * GET /api/auth/status
 * Returns whether OAuth is configured and bot info for the desktop app.
 */
router.get('/status', (_req: Request, res: Response) => {
  const oauthConfigured = !!(DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET);
  const botUser = _botClient?.user;

  res.json({
    oauthConfigured,
    bot: botUser
      ? {
          id: botUser.id,
          username: botUser.username,
          avatar: botUser.displayAvatarURL?.() ?? null,
        }
      : null,
  });
});

/**
 * GET /api/auth/quick-connect
 * Returns the bot's guild list directly — no OAuth needed.
 * Used when Discord OAuth isn't configured.
 */
router.get('/quick-connect', (_req: Request, res: Response) => {
  if (!_botClient) {
    return res.status(503).json({ error: 'Bot not ready' });
  }

  const botUser = _botClient.user;
  const guilds = _botClient.guilds.cache.map((g: Guild) => ({
    id: g.id,
    name: g.name,
    icon: g.iconURL?.() ?? null,
    memberCount: g.memberCount,
    botPresent: true,
  }));

  // Create a simple JWT for API auth (no Discord user token)
  const token = jwt.sign(
    {
      userId: 'local',
      username: 'Dashboard User',
      avatar: null,
      accessToken: '',
    } satisfies TokenPayload,
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY },
  );

  res.json({
    token,
    bot: botUser
      ? {
          id: botUser.id,
          username: botUser.username,
          avatar: botUser.displayAvatarURL?.() ?? null,
        }
      : null,
    guilds,
  });
});

export type AuthedRequest = Request & { auth: TokenPayload };

/**
 * Verify a JWT token and return its payload. Throws on invalid/expired token.
 * Used by HTTP middleware and the WebSocket upgrade handshake.
 */
export function verifyJwtToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

/**
 * JWT verification middleware for protecting routes.
 *
 * Accepts the token from either `Authorization: Bearer <jwt>` or a `?token=`
 * query parameter. The query fallback exists because HTML media elements
 * (`<audio>`/`<video>`) cannot set request headers, so stream endpoints
 * fetched by the browser pass the token via query string.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  let token: string | null = null;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (typeof req.query.token === 'string' && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const payload = verifyJwtToken(token);
    (req as AuthedRequest).auth = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Cache of accessToken -> { guildIds, expiresAt } to avoid hitting Discord on every request.
const userGuildCache = new Map<string, { guildIds: Set<string>; expiresAt: number }>();
const USER_GUILD_TTL_MS = 5 * 60 * 1000;

async function fetchUserGuildIds(accessToken: string): Promise<Set<string> | null> {
  const cached = userGuildCache.get(accessToken);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.guildIds;
  }

  const resp = await fetch(`${DISCORD_API}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) return null;

  const userGuilds = (await resp.json()) as DiscordGuild[];
  const guildIds = new Set(userGuilds.map((g) => g.id));

  userGuildCache.set(accessToken, { guildIds, expiresAt: Date.now() + USER_GUILD_TTL_MS });
  // Periodic cleanup to cap memory — drop expired entries when cache grows.
  if (userGuildCache.size > 500) {
    const now = Date.now();
    for (const [key, value] of userGuildCache.entries()) {
      if (value.expiresAt <= now) userGuildCache.delete(key);
    }
  }
  return guildIds;
}

/**
 * Extract guildId from header / query / body. Returns null if absent.
 */
function extractGuildId(req: Request): string | null {
  const header = req.headers['x-guild-id'];
  if (typeof header === 'string' && header) return header;
  const query = req.query.guildId;
  if (typeof query === 'string' && query) return query;
  const params = req.params?.guildId;
  if (typeof params === 'string' && params) return params;
  const body = req.body;
  if (body && typeof body === 'object' && typeof body.guildId === 'string') return body.guildId;
  return null;
}

/**
 * Middleware that ensures the authenticated user has access to the targeted guild.
 * Must run AFTER requireAuth. Requires an explicit guildId on the request.
 *
 * Rules:
 *  - Quick-connect tokens (userId === 'local') — trusted, any bot guild allowed.
 *  - Discord-OAuth tokens — user must be a member of the guild (via Discord API) AND the bot must be in it.
 */
export async function requireGuildAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  const auth = (req as AuthedRequest).auth;
  if (!auth) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const guildId = extractGuildId(req);
  if (!guildId) {
    res.status(400).json({ error: 'guildId is required' });
    return;
  }

  if (!_botGuildIds.has(guildId)) {
    res.status(403).json({ error: 'Bot is not a member of this guild' });
    return;
  }

  // Quick-connect users have full access to whatever guilds the bot is in.
  if (auth.userId === 'local' || !auth.accessToken) {
    next();
    return;
  }

  try {
    const userGuildIds = await fetchUserGuildIds(auth.accessToken);
    if (!userGuildIds) {
      res.status(401).json({ error: 'Discord token expired' });
      return;
    }
    if (!userGuildIds.has(guildId)) {
      res.status(403).json({ error: 'You do not have access to this guild' });
      return;
    }
    next();
  } catch (err) {
    log.warn({ err, guildId, userId: auth.userId }, 'Guild access check failed');
    res.status(500).json({ error: 'Failed to verify guild access' });
  }
}

export default router;
