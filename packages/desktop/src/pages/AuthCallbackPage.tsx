import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBotStore } from '@/stores/useBotStore';

/** Web-mode OAuth landing page.
 *  `/api/auth/callback` redirects here with `?token=<jwt>`. We grab the token,
 *  hand it to the bot store, then scrub the URL and send the user home. */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const connectToBot = useBotStore((s) => s.connectToBot);

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.hash.includes('?')
        ? window.location.hash.slice(window.location.hash.indexOf('?'))
        : window.location.search,
    );
    const token = params.get('token');
    const error = params.get('error');

    if (token) {
      window.history.replaceState(null, '', window.location.pathname + '#/dashboard');
      connectToBot(token);
      navigate('/dashboard', { replace: true });
      return;
    }

    if (error) {
      navigate(`/dashboard?authError=${encodeURIComponent(error)}`, { replace: true });
      return;
    }

    navigate('/dashboard', { replace: true });
  }, [connectToBot, navigate]);

  return (
    <div className="flex h-full items-center justify-center text-t-tertiary">
      <p className="text-sm">Finishing sign-in…</p>
    </div>
  );
}
