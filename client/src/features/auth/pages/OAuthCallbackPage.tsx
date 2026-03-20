import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import { ROUTES } from '../../../core/constants';

export const OAuthCallbackPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { completeOAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const processedTicketRef = useRef<string | null>(null);

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  useEffect(() => {
    const run = async () => {
      const ticket = params.get('ticket');
      const returnUrl = params.get('returnUrl') || ROUTES.CATALOG;
      const oauthError = params.get('error');

      if (oauthError) {
        setError('OAuth авторизація завершилась з помилкою.');
        return;
      }

      if (!ticket) {
        setError('OAuth ticket відсутній.');
        return;
      }

      if (processedTicketRef.current === ticket) {
        return;
      }

      processedTicketRef.current = ticket;

      try {
        await completeOAuth(ticket);
        navigate(returnUrl.startsWith('/') ? returnUrl : ROUTES.CATALOG, { replace: true });
      } catch (err) {
        const message = typeof err === 'string'
          ? err
          : typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message?: unknown }).message ?? '')
            : '';

        setError(message || 'Не вдалося завершити вхід через OAuth.');
      }
    };

    run();
  }, [completeOAuth, navigate, params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-surface-hover bg-surface p-6 text-center">
        {error ? (
          <>
            <p className="text-red-400 mb-4">{error}</p>
            <Link
              to={`${ROUTES.CATALOG}?auth=login`}
              className="inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Повернутись до входу
            </Link>
          </>
        ) : (
          <p className="text-text-secondary">Завершуємо авторизацію...</p>
        )}
      </div>
    </div>
  );
};
