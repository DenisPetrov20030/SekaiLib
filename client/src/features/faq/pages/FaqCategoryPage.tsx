import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { faqApi } from '../../../core/api/faq';
import type { FaqItem } from '../../../core/types/entities';
import { FAQ_CATEGORIES } from './FaqPage';

export function FaqCategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  // Знаходимо назву поточної категорії для заголовка
  const currentCategory = FAQ_CATEGORIES.find((category) => category.id === categoryId);

  useEffect(() => {
    setLoading(true);
    faqApi.getPublished()
      .then((res) => {
        // Якщо бекенд повертає всі питання, фільтруємо їх на фронтенді.
        // (Припускаємо, що у FaqItem є поле categoryId)
        const filtered = res.data.filter((item) => {
          const typedItem = item as FaqItem & { categoryId?: string };
          return typedItem.categoryId === categoryId;
        });
        setItems(filtered);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [categoryId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Кнопка "Назад" та заголовок */}
      <div className="mb-8">
        <Link to="/faq" className="inline-flex items-center text-sm text-text-muted hover:text-primary-500 transition-colors mb-4">
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Назад до категорій
        </Link>
        <h1 className="text-3xl font-bold text-text-primary">
          {currentCategory?.title || 'Запитання'}
        </h1>
      </div>

      {items.length === 0 ? (
        <p className="text-text-muted text-center py-12 bg-surface border border-dashed border-surface-700 rounded-xl">
          В цій категорії поки немає питань
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-surface rounded-lg border border-surface-700 overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-hover transition-colors"
                onClick={() => setOpenId(openId === item.id ? null : item.id)}
              >
                <span className="font-medium text-text-primary pr-4">{item.question}</span>
                <svg
                  className={`w-5 h-5 text-text-muted shrink-0 transition-transform ${
                    openId === item.id ? 'rotate-180 text-primary-500' : ''
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