import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentsApi } from '../../../core/api/payments';

interface PaymentGateProps {
  chapterId: string;
  chapterName: string;
  titleName: string;
  price: number;
  earlyAccessUntil?: string | null;
}

const formatFreeDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const PaymentGate = ({ chapterId, chapterName, titleName, price, earlyAccessUntil }: PaymentGateProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handlePurchase = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentsApi.createChapterPayment(chapterId);

      // Відкриваємо LiqPay checkout у новій вкладці через форму
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = result.checkoutUrl;
      form.target = '_blank';

      const dataInput = document.createElement('input');
      dataInput.type = 'hidden';
      dataInput.name = 'data';
      dataInput.value = result.data;
      form.appendChild(dataInput);

      const sigInput = document.createElement('input');
      sigInput.type = 'hidden';
      sigInput.name = 'signature';
      sigInput.value = result.signature;
      form.appendChild(sigInput);

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);

      // Перенаправляємо на сторінку результату платежу
      navigate(`/payment/result?orderId=${result.orderId}`);
    } catch (e: unknown) {
      const message = e && typeof e === 'object' && 'response' in e
        ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      setError(message ?? 'Не вдалося ініціювати оплату. Спробуйте ще раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
      <div className="bg-surface-1 border border-border rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
        {/* Lock icon */}
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary-500/10 mx-auto mb-6">
          <svg className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-text-primary mb-1">{titleName}</h2>
        <p className="text-text-secondary mb-6 text-sm">{chapterName}</p>

        <div className="bg-surface-2 rounded-xl p-4 mb-4">
          <p className="text-text-secondary text-sm mb-1">Ціна розділу</p>
          <p className="text-3xl font-bold text-primary-400">{price.toFixed(2)} ₴</p>
        </div>

        {earlyAccessUntil && (
          <p className="text-text-muted text-sm mb-6">
            Стане безкоштовним{' '}
            <span className="text-text-secondary font-medium">{formatFreeDate(earlyAccessUntil)}</span>
          </p>
        )}

        {error && (
          <p className="text-red-400 text-sm mb-4 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          onClick={handlePurchase}
          disabled={loading}
          className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 px-6 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Підготовка оплати...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Придбати за {price.toFixed(2)} ₴
            </>
          )}
        </button>

        <p className="text-text-muted text-sm mt-4">
          Оплата через LiqPay. Безпечно та зручно.
        </p>
      </div>
    </div>
  );
};
