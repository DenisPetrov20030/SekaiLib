import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { paymentsApi } from '../../../core/api/payments';
import type { PaymentStatusDto } from '../../../core/api/payments';

const MAX_POLLS = 20;
const POLL_INTERVAL = 5000;

export const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');

  const [status, setStatus] = useState<PaymentStatusDto | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  const isDone = (s: PaymentStatusDto) =>
    s.status === 'Success' || s.status === 'Sandbox' || s.status === 'Failure' || s.status === 'Reversed';

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleManualRefresh = useCallback(async () => {
    if (!orderId) return;
    setRefreshing(true);
    try {
      const data = await paymentsApi.refreshStatus(orderId);
      setStatus(data);
      if (isDone(data)) stopPolling();
    } catch {
      setError('Не вдалося перевірити статус у LiqPay.');
    } finally {
      setRefreshing(false);
    }
  }, [orderId, stopPolling]);

  useEffect(() => {
    if (!orderId) {
      setError('Відсутній ідентифікатор замовлення у параметрах URL.');
      return;
    }

    const poll = async () => {
      if (pollCountRef.current >= MAX_POLLS) {
        stopPolling();
        return;
      }

      try {
        const data = await paymentsApi.refreshStatus(orderId);
        pollCountRef.current += 1;
        setPollCount(pollCountRef.current);
        setStatus(data);

        if (isDone(data)) stopPolling();
      } catch {
        setError('Не вдалося отримати статус платежу.');
        stopPolling();
      }
    };

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL);

    return stopPolling;
  }, [orderId, stopPolling]);

  const isSuccess = status?.status === 'Success' || status?.status === 'Sandbox';
  const isFailure = status?.status === 'Failure' || status?.status === 'Reversed';
  const isPending = !status || status.status === 'Pending';
  const isTimeout = pollCount >= MAX_POLLS && isPending;

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="bg-surface-1 border border-border rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
        {error ? (
          <>
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mx-auto mb-6">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Помилка</h2>
            <p className="text-text-secondary text-sm mb-6">{error}</p>
          </>
        ) : isSuccess ? (
          <>
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mx-auto mb-6">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Оплата успішна!</h2>
            <p className="text-text-secondary text-sm mb-2">
              Сума: <span className="text-text-primary font-semibold">{status?.amount.toFixed(2)} ₴</span>
            </p>
            <p className="text-text-muted text-xs mb-6">Розділ відкрито. Можете продовжувати читання.</p>
          </>
        ) : isFailure ? (
          <>
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mx-auto mb-6">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Оплата не пройшла</h2>
            <p className="text-text-secondary text-sm mb-6">
              {status?.status === 'Reversed' ? 'Платіж було скасовано.' : 'Спробуйте ще раз.'}
            </p>
          </>
        ) : isTimeout ? (
          <>
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/10 mx-auto mb-6">
              <svg className="w-8 h-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Перевіряємо оплату</h2>
            <p className="text-text-secondary text-sm mb-4">
              Оновлення статусу не надійшло. Натисніть кнопку нижче щоб перевірити у LiqPay.
            </p>
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 px-6 transition-colors mb-2"
            >
              {refreshing ? 'Перевіряємо...' : 'Перевірити статус'}
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary-500/10 mx-auto mb-6">
              <svg className="animate-spin w-8 h-8 text-primary-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Обробка платежу</h2>
            <p className="text-text-secondary text-sm mb-6">
              Зачекайте, перевіряємо статус...
            </p>
          </>
        )}

        <div className="flex flex-col gap-3">
          {isSuccess && (
            <button
              onClick={() => navigate(-1)}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl py-3 px-6 transition-colors"
            >
              Читати розділ
            </button>
          )}
          <Link
            to="/"
            className="w-full text-center text-text-secondary hover:text-text-primary text-sm py-2 transition-colors"
          >
            На головну
          </Link>
        </div>

        {orderId && (
          <p className="text-text-muted text-xs mt-4">
            ID замовлення: {orderId}
          </p>
        )}
      </div>
    </div>
  );
};
