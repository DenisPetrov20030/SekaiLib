import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { forumApi } from '../../../core/api/forum';
import type { ForumCategoryDto, ForumThreadDto } from '../../../core/api/forum';
import { useAppSelector } from '../../../app/store/hooks';
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

export const ForumCategoryPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);

  const [category, setCategory] = useState<ForumCategoryDto | null>(null);
  const [threads, setThreads] = useState<ForumThreadDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const PAGE_SIZE = 20;

  // New thread modal
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId) return;
    setLoading(true);

    Promise.all([
      forumApi.getCategories(),
      forumApi.getThreads(categoryId, page, PAGE_SIZE),
    ]).then(([cats, result]) => {
      const cat = cats.find(c => c.id === categoryId);
      if (cat) setCategory(cat);
      setThreads(result.data);
      setTotalCount(result.totalCount);
    }).finally(() => setLoading(false));
  }, [categoryId, page]);

  const handleCreateThread = async () => {
    if (!newTitle.trim() || !newContent.trim() || !categoryId) return;
    setCreating(true);
    setCreateError(null);
    try {
      const thread = await forumApi.createThread({
        categoryId,
        title: newTitle.trim(),
        content: newContent.trim(),
      });
      navigate(ROUTES.FORUM_THREAD.replace(':threadId', thread.id));
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e
        ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      setCreateError(msg ?? 'Не вдалося створити тред.');
    } finally {
      setCreating(false);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-text-secondary mb-6 flex items-center gap-2">
        <Link to={ROUTES.FORUM} className="hover:text-primary-400 transition-colors">Форум</Link>
        <span>/</span>
        <span className="text-text-primary">{category?.name ?? '...'}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center flex-shrink-0">
            {category?.iconEmoji ? (
              <span className="text-2xl">{category.iconEmoji}</span>
            ) : (
              <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{category?.name}</h1>
            {category?.description && (
              <p className="text-text-secondary text-sm mt-0.5">{category.description}</p>
            )}
          </div>
        </div>

        {user && (
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Новий тред
          </button>
        )}
      </div>

      {/* Threads list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-surface-1 border border-border rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-surface-2 rounded w-3/4 mb-2" />
              <div className="h-3 bg-surface-2 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : threads.length === 0 ? (
        <div className="text-center py-16 text-text-secondary">
          <svg className="w-14 h-14 text-text-muted/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-lg font-medium">Тредів поки немає</p>
          {user && <p className="text-sm mt-2">Будьте першим — створіть тред!</p>}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {threads.map(thread => (
              <Link
                key={thread.id}
                to={ROUTES.FORUM_THREAD.replace(':threadId', thread.id)}
                className="flex items-center gap-4 bg-surface-1 border border-border rounded-xl px-4 py-3 hover:border-primary-500/50 group transition-colors"
              >
                {/* Status icons */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0 w-8">
                  {thread.isPinned && (
                    <svg className="w-4 h-4 text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
                    </svg>
                  )}
                  {thread.isLocked && (
                    <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                  {!thread.isPinned && !thread.isLocked && (
                    <svg className="w-4 h-4 text-text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  )}
                </div>

                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary group-hover:text-primary-400 transition-colors line-clamp-1">
                    {thread.title}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    <span className="text-primary-400">@{thread.authorUsername}</span>
                    {' · '}{formatRelativeDate(thread.createdAt)}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex gap-5 flex-shrink-0 text-sm text-right">
                  <div>
                    <p className="font-semibold text-text-primary">{thread.replyCount}</p>
                    <p className="text-xs text-text-muted">відп.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{thread.viewCount}</p>
                    <p className="text-xs text-text-muted">перегл.</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-text-secondary">{thread.lastPostUsername ? `@${thread.lastPostUsername}` : '—'}</p>
                    <p className="text-xs text-text-muted">{formatRelativeDate(thread.lastPostAt)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg bg-surface-1 border border-border text-text-secondary hover:text-text-primary disabled:opacity-40 text-sm transition-colors"
              >
                ←
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                    p === page
                      ? 'bg-primary-500 border-primary-500 text-white'
                      : 'bg-surface-1 border-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg bg-surface-1 border border-border text-text-secondary hover:text-text-primary disabled:opacity-40 text-sm transition-colors"
              >
                →
              </button>
            </div>
          )}
        </>
      )}

      {/* New Thread Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-surface-1 border border-border rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-text-primary mb-5">Новий тред</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">Заголовок *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Тема обговорення..."
                  maxLength={200}
                  className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-text-primary focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-1">Повідомлення *</label>
                <textarea
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="Ваше повідомлення..."
                  rows={6}
                  className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-text-primary focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>

              {createError && (
                <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2">{createError}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowNew(false); setCreateError(null); }}
                className="px-4 py-2 text-text-secondary hover:text-text-primary text-sm transition-colors"
              >
                Скасувати
              </button>
              <button
                onClick={handleCreateThread}
                disabled={creating || !newTitle.trim() || !newContent.trim()}
                className="px-5 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {creating ? 'Публікація...' : 'Опублікувати'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
