import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { forumApi } from '../../../core/api/forum';
import type { ForumCategoryDto } from '../../../core/api/forum';
import { useAppSelector } from '../../../app/store/hooks';
import { UserRole } from '../../../core/types/enums';
import { ROUTES } from '../../../core/constants';

function formatRelativeDate(iso: string) {
  const d = new Date(iso);
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);
  if (diff < 60) return 'щойно';
  if (diff < 3600) return `${Math.floor(diff / 60)} хв тому`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} год тому`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} дн тому`;
  return d.toLocaleDateString('uk-UA');
}

export const ForumPage = () => {
  const user = useAppSelector((s) => s.auth.user);
  const isModerator = user && user.role >= UserRole.Moderator;

  const [categories, setCategories] = useState<ForumCategoryDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin: new category modal
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    forumApi.getCategories().then(setCategories).finally(() => setLoading(false));
  }, []);

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setSaving(true);
    try {
      const cat = await forumApi.createCategory({
        name: newCatName.trim(),
        description: newCatDesc.trim() || undefined,
        iconEmoji: newCatEmoji || undefined,
        sortOrder: categories.length,
      });
      setCategories(prev => [...prev, cat]);
      setShowNewCategory(false);
      setNewCatName('');
      setNewCatDesc('');
      setNewCatEmoji('');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Форум</h1>
          <p className="text-text-secondary mt-1">Обговорення тайтлів, новини та спільнота</p>
        </div>
        {isModerator && (
          <button
            onClick={() => setShowNewCategory(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Нова категорія
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8 text-text-secondary">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
          <p className="mt-3">Завантаження форуму...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 text-text-secondary">
          <svg className="w-14 h-14 text-text-muted/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-lg font-medium">Форум поки порожній</p>
          {isModerator && <p className="text-sm mt-2">Створіть першу категорію</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map(cat => (
            <Link
              key={cat.id}
              to={ROUTES.FORUM_CATEGORY.replace(':categoryId', cat.id)}
              className="block bg-surface-1 border border-border rounded-xl p-5 hover:border-primary-500/50 transition-colors group"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-500/20 transition-colors">
                  {cat.iconEmoji ? (
                    <span className="text-2xl">{cat.iconEmoji}</span>
                  ) : (
                    <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  )}
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-text-primary group-hover:text-primary-400 transition-colors">
                      {cat.name}
                    </h2>
                  </div>
                  {cat.description && (
                    <p className="text-text-secondary text-sm mt-0.5 line-clamp-1">{cat.description}</p>
                  )}

                  {/* Last post */}
                  {cat.lastPostAt && (
                    <p className="text-text-muted text-xs mt-2">
                      Остання активність:{' '}
                      <span className="text-text-secondary">{cat.lastPostThreadTitle}</span>
                      {cat.lastPostUsername && (
                        <> · <span className="text-primary-400">@{cat.lastPostUsername}</span></>
                      )}
                      {' · '}{formatRelativeDate(cat.lastPostAt)}
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="flex gap-6 flex-shrink-0 text-right">
                  <div>
                    <p className="text-lg font-bold text-text-primary">{cat.threadCount}</p>
                    <p className="text-xs text-text-muted">тредів</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-text-primary">{cat.postCount}</p>
                    <p className="text-xs text-text-muted">дописів</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* New Category Modal */}
      {showNewCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-surface-1 border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-text-primary mb-5">Нова категорія</h3>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Іконка</label>
                  <input
                    type="text"
                    value={newCatEmoji}
                    onChange={e => setNewCatEmoji(e.target.value)}
                    className="w-16 text-center text-2xl px-2 py-2 rounded-lg bg-surface-2 border border-border focus:outline-none focus:border-primary-500"
                    maxLength={2}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-text-secondary mb-1">Назва *</label>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    placeholder="Загальне обговорення"
                    className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-text-primary focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-1">Опис</label>
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={e => setNewCatDesc(e.target.value)}
                  placeholder="Необов'язково"
                  className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-text-primary focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowNewCategory(false)}
                className="px-4 py-2 text-text-secondary hover:text-text-primary text-sm transition-colors"
              >
                Скасувати
              </button>
              <button
                onClick={handleCreateCategory}
                disabled={saving || !newCatName.trim()}
                className="px-5 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {saving ? 'Збереження...' : 'Створити'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
