import { useEffect, useState } from 'react';
import { faqApi } from '../../../core/api/faq';
import type { FaqItem } from '../../../core/types/entities';

export const FAQ_CATEGORIES: { id: string; title: string }[] = [
  { id: 'general', title: 'Загальні питання' },
  { id: 'account', title: 'Обліковий запис' },
  { id: 'content', title: 'Контент і читання' },
  { id: 'community', title: 'Спільнота' },
];

export function FaqPage() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    faqApi.getPublished()
      .then((res) => setItems(res.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-text-primary mb-2">FAQ</h1>
      <p className="text-text-muted mb-8">Відповіді на поширені запитання</p>

      {items.length === 0 ? (
        <p className="text-text-muted text-center py-12">Питань поки немає</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-surface-800 rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-700 transition-colors"
                onClick={() => setOpenId(openId === item.id ? null : item.id)}
              >
                <span className="font-medium text-text-primary pr-4">{item.question}</span>
                <svg
                  className={`w-5 h-5 text-text-muted shrink-0 transition-transform ${
                    openId === item.id ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openId === item.id && (
                <div className="px-5 pb-5 text-text-secondary leading-relaxed border-t border-surface-700 pt-4">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
