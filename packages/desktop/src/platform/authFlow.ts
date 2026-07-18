import { isTauri } from './detect';
import { openExternal } from './shell';

export type ClientKind = 'tauri' | 'web';

export function clientKind(): ClientKind {
  return isTauri() ? 'tauri' : 'web';
}

/** Launch the Discord OAuth flow.
 *  Tauri: opens the auth URL in the default browser; the token comes back via
 *    the deep-link listener registered by `registerAuthCallback()`.
 *  Web: navigates the current tab to Discord; the token comes back as a query
 *    param on the `/auth/callback` SPA route (handled by `AuthCallback`). */
export async function startOAuth(authUrl: string): Promise<void> {
  if (isTauri()) {
    await openExternal(authUrl);
    return;
  }
  window.location.href = authUrl;
}

/** Register the Tauri deep-link listener. Returns an unlisten function, or
 *  `null` in browser mode. */
export async function registerDeepLinkAuth(onToken: (token: string) => void): Promise<(() => void) | null> {
  if (!isTauri()) return null;

  try {
    const { onOpenUrl } = await import('@tauri-apps/plugin-deep-link');
    const unlisten = await onOpenUrl((urls: string[]) => {
      for (const url of urls) {
        if (url.includes('auth') && url.includes('token=')) {
          const urlObj = new URL(url.replace('downunder://', 'http://localhost/'));
          const token = urlObj.searchParams.get('token');
          if (token) onToken(token);
        }
      }
    });
    return unlisten;
  } catch {
    return null;
  }
}
