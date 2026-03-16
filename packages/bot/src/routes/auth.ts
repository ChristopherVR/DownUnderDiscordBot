import { Request, Response, Router } from 'express';
import type { Router as RouterType } from 'express';
import jwt from 'jsonwebtoken';
import type { Client, Guild } from 'discord.js';
import { createLogger } from '../helpers/logger.js';

const log = createLogger('auth');
const router: RouterType = Router();

const DISCORD_API = 'https://discord.com/api/v10';
const JWT_SECRET = process.env.JWT_SECRET || 'downunder-dev-secret-change-in-prod';
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
 * Returns the Discord OAuth2 authorization URL for the client to redirect to.
 */
router.get('/discord', (_req: Request, res: Response) => {
  if (!DISCORD_CLIENT_ID) {
    return res.status(500).json({ error: 'Discord OAuth not configured' });
  }

  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify guilds',
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
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

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

    // Redirect to Tauri app via deep link or to a success page
    const redirectUrl = `downunder://auth?token=${encodeURIComponent(token)}`;

    // Also provide a web fallback page
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

    log.info({ userId: user.id, username: user.username }, 'User authenticated');
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

/**
 * JWT verification middleware for protecting routes.
 */
export function requireAuth(req: Request, res: Response, next: () => void): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    (req as Request & { auth: TokenPayload }).auth = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export default router;
