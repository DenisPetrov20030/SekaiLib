import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { newsApi } from '../../../core/api/news';
import type { NewsItem } from '../../../core/types/entities';
import { ROUTES } from '../../../core/constants';

const NEWS_TYPES = ['Новина', 'Оновлення'] as const;
type NewsType = typeof NEWS_TYPES[number];
type NewsCategory = NewsType | 'Акція';

const ITEMS_PER_PAGE = 10;

function detectNewsType(item: NewsItem): NewsCategory {
  const text = `${item.title} ${item.content}`.toLowerCase();

  if (
    text.includes('#акція') ||
    text.includes('акція') ||
    text.includes('бонус') ||
    text.includes('знижк') ||
    text.includes('promo')
  ) {
    return 'Акція';
  }

  if (
    text.includes('#обновление') ||
    text.includes('#оновлення') ||
    text.includes('оновлен') ||
    text.includes('обновлен') ||
    text.includes('версія') ||
    text.includes('версия') ||
    text.includes('update')
  ) {
    return 'Оновлення';
  }

  return 'Новина';
}

function isSelectableNewsType(type: NewsCategory): type is NewsType {
  return type !== 'Акція';
}

function getPageButtons(currentPage: number, totalPages: number): Array<number | '...'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, '...', totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}

export function NewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedTypes, setSelectedTypes] = useState<NewsType[]>([...NEWS_TYPES]);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setLoading(true);
    try {
      const res = await newsApi.getPublished(1, 200);
      setItems(res.data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const toggleType = (type: NewsType) => {
    setPage(1);
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type);
      }

      return [...prev, type];
    });
  };

  const filteredItems = selectedTypes.length === 0
    ? items
    : items.filter((item) => {
        const type = detectNewsType(item);
        return isSelectableNewsType(type) && selectedTypes.includes(type);
      });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filteredItems.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  const pageButtons = getPageButtons(safePage, totalPages);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Новини</h1>
        <p className="text-text-secondary">Найові оновлення та важливі оголошення</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1">
          {pageItems.length === 0 ? (
            <p className="text-text-muted text-center py-12">За обраними фільтрами новин немає</p>
          ) : (
            <div className="space-y-4">
              {pageItems.map((item) => {
                const type = detectNewsType(item);
                return (
                  <Link
                    key={item.id}
                    to={ROUTES.NEWS_DETAILS.replace(':id', item.id)}
                    className="block bg-surface rounded-xl p-5 hover:bg-surface-hover transition-colors border border-surface-hover/50"
                  >
                    <div>
                      <p className="text-xs font-semibold text-primary-400 uppercase tracking-wide mb-1">{type}</p>
                      <h2 className="text-lg font-bold text-text-primary mb-2 hover:text-primary-400 transition-colors line-clamp-2">
                        {item.title}
                      </h2>
                      <p className="text-text-secondary text-sm line-clamp-2">
                        {item.content.replace(/<[^>]*>/g, '').slice(0, 220)}...
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mt-3 text-xs text-text-muted">
                      <span>{item.authorUsername}</span>
                      <span>·</span>
                      <span>{new Date(item.createdAt).toLocaleDateString('uk-UA')}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8 flex-wrap">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="px-3 py-2 rounded-lg bg-surface-hover text-text-primary disabled:opacity-40 hover:bg-surface-hover transition-colors"
              >
                ←
              </button>

              {pageButtons.map((btn, index) =>
                btn === '...' ? (
                  <span key={`dots-${index}`} className="px-2 text-text-muted">...</span>
                ) : (
                  <button
                    key={btn}
                    onClick={() => setPage(btn)}
                    className={`min-w-9 px-3 py-2 rounded-lg transition-colors ${
                      safePage === btn
                        ? 'bg-primary-600 text-white'
                        : 'bg-surface-hover text-text-primary hover:bg-surface-hover'
                    }`}
                  >
                    {btn}
                  </button>
                )
              )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="px-3 py-2 rounded-lg bg-surface-hover text-text-primary disabled:opacity-40 hover:bg-surface-hover transition-colors"
              >
                →
              </button>
            </div>
          )}
        </div>

        {/* Sidebar filters */}
        <aside className="w-full lg:w-64 h-fit bg-surface rounded-xl p-4 border border-surface-hover/50">
          <h3 className="text-sm font-bold text-text-primary mb-3">Фільтри</h3>
          <p className="text-xs uppercase tracking-wide text-text-muted mb-3">Тип</p>
          <div className="space-y-2 mb-4">
            {NEWS_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type)}
                  onChange={() => toggleType(type)}
                  className="w-4 h-4 accent-primary-500"
                />
                <span>{type}</span>
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedTypes([]);
              setPage(1);
            }}
            className="w-full text-sm px-3 py-2 rounded-lg bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 transition-colors"
          >
            Скинути фільтри
          </button>

          <p className="mt-4 text-xs text-text-muted">
            Знайдено: <span className="text-text-primary font-semibold">{filteredItems.length}</span>
          </p>
        </aside>
      </div>
    </div>
  );
}