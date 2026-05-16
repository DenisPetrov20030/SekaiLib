import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { forumApi } from '../../../core/api/forum';
import type { ForumThreadDetailsDto, ForumPostDto } from '../../../core/api/forum';
import { useAppSelector } from '../../../app/store/hooks';
import { UserRole } from '../../../core/types/enums';
import { ROUTES } from '../../../core/constants';

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);
  if (diff < 60) return 'щойно';
  if (diff < 3600) return `${Math.floor(diff / 60)} хв тому`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} год тому`;
  return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const PAGE_SIZE = 30;

export const ForumThreadPage = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const isModerator = user && user.role >= UserRole.Moderator;

  const [thread, setThread] = useState<ForumThreadDetailsDto | null>(null);
  const [posts, setPosts] = useState<ForumPostDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Reply
  const [replyContent, setReplyContent] = useState('');
  const [quotedPost, setQuotedPost] = useState<ForumPostDto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  // Edit
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (!threadId) return;
    setLoading(true);

    Promise.all([
      forumApi.getThread(threadId),
      forumApi.getPosts(threadId, page, PAGE_SIZE),
    ]).then(([t, p]) => {
      setThread(t);
      setPosts(p.data);
      setTotalCount(p.totalCount);
    }).finally(() => setLoading(false));
  }, [threadId, page]);

  const handleReply = async () => {
    if (!replyContent.trim() || !threadId) return;
    setSubmitting(true);
    setReplyError(null);
    try {
      const post = await forumApi.createPost(threadId, {
        content: replyContent.trim(),
        quotedPostId: quotedPost?.id,
      });
      setPosts(prev => [...prev, post]);
      setTotalCount(c => c + 1);
      if (thread) setThread({ ...thread, replyCount: thread.replyCount + 1 });
      setReplyContent('');
      setQuotedPost(null);
      // Scroll to bottom
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e
        ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      setReplyError(msg ?? 'Не вдалося відповісти.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Видалити повідомлення?')) return;
    try {
      await forumApi.deletePost(postId);
      setPosts(prev => prev.map(p => p.id === postId
        ? { ...p, content: '[Повідомлення видалено]', isOwn: false, canDelete: false }
        : p
      ));
    } catch (e) { console.error(e); }
  };

  const handleDeleteThread = async () => {
    if (!thread || !confirm('Видалити тред? Всі дописи будуть видалені.')) return;
    try {
      await forumApi.deleteThread(thread.id);
      navigate(ROUTES.FORUM_CATEGORY.replace(':categoryId', thread.categoryId));
    } catch (e) { console.error(e); }
  };

  const startEdit = (post: ForumPostDto) => {
    setEditingPostId(post.id);
    setEditContent(post.content);
  };

  const handleEdit = async (postId: string) => {
    if (!editContent.trim()) return;
    try {
      const updated = await forumApi.updatePost(postId, { content: editContent.trim() });
      setPosts(prev => prev.map(p => p.id === postId ? updated : p));
      setEditingPostId(null);
    } catch (e) { console.error(e); }
  };

  const handleReact = async (post: ForumPostDto, isLike: boolean) => {
    if (!user) return;
    try {
      let updated: ForumPostDto;
      if (post.userReaction === isLike) {
        // Toggle off
        updated = await forumApi.removeReaction(post.id);
      } else {
        updated = await forumApi.react(post.id, isLike);
      }
      setPosts(prev => prev.map(p => p.id === post.id ? updated : p));
    } catch (e) { console.error(e); }
  };

  const handleQuote = (post: ForumPostDto) => {
    setQuotedPost(post);
    replyRef.current?.focus();
    replyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handlePin = async () => {
    if (!thread) return;
    await forumApi.pinThread(thread.id, !thread.isPinned);
    setThread(t => t ? { ...t, isPinned: !t.isPinned } : t);
  };

  const handleLock = async () => {
    if (!thread) return;
    await forumApi.lockThread(thread.id, !thread.isLocked);
    setThread(t => t ? { ...t, isLocked: !t.isLocked } : t);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-surface-1 border border-border rounded-xl p-5 animate-pulse">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-2 flex-shrink-0" />
              <div className="flex-1">
                <div className="h-4 bg-surface-2 rounded w-32 mb-3" />
                <div className="h-3 bg-surface-2 rounded w-full mb-2" />
                <div className="h-3 bg-surface-2 rounded w-3/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-text-secondary">
        <p className="text-xl">Тред не знайдено</p>
        <Link to={ROUTES.FORUM} className="text-primary-400 text-sm mt-2 inline-block">← На форум</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-text-secondary mb-6 flex items-center gap-2">
        <Link to={ROUTES.FORUM} className="hover:text-primary-400 transition-colors">Форум</Link>
        <span>/</span>
        <Link to={ROUTES.FORUM_CATEGORY.replace(':categoryId', thread.categoryId)} className="hover:text-primary-400 transition-colors">
          {thread.categoryName}
        </Link>
        <span>/</span>
        <span className="text-text-primary line-clamp-1">{thread.title}</span>
      </nav>

      {/* Thread header */}
      <div className="bg-surface-1 border border-border rounded-xl p-5 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {thread.isPinned && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                  Закріплено
                </span>
              )}
              {thread.isLocked && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  Заблоковано
                </span>
              )}
              <h1 className="text-2xl font-bold text-text-primary">{thread.title}</h1>
            </div>
            <p className="text-text-muted text-sm mt-2">
              <span className="text-primary-400">@{thread.authorUsername}</span>
              {' · '}{formatDate(thread.createdAt)}
              {' · '}<span className="text-text-secondary">{thread.viewCount} переглядів · {thread.replyCount} відп.</span>
            </p>
          </div>

          {/* Moderator controls */}
          {isModerator && (
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={handlePin}
                title={thread.isPinned ? 'Відкріпити' : 'Закріпити'}
                className="p-2 rounded-lg bg-surface-2 hover:bg-surface-3 text-text-secondary hover:text-text-primary transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
              </button>
              <button
                onClick={handleLock}
                title={thread.isLocked ? 'Розблокувати' : 'Заблокувати'}
                className="p-2 rounded-lg bg-surface-2 hover:bg-surface-3 text-text-secondary hover:text-text-primary transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </button>
              <button
                onClick={handleDeleteThread}
                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                title="Видалити тред"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-3">
        {posts.map((post, index) => (
          <div
            key={post.id}
            id={`post-${post.id}`}
            className={`bg-surface-1 border rounded-xl p-5 transition-colors ${
              post.content === '[Повідомлення видалено]' ? 'border-border opacity-60' : 'border-border'
            }`}
          >
            {/* Quoted post */}
            {post.quotedPostContent && (
              <div className="mb-3 pl-3 border-l-2 border-primary-500/40 bg-surface-2/60 rounded-r-lg px-3 py-2">
                <p className="text-xs text-primary-400 font-medium mb-1">
                  @{post.quotedPostAuthorUsername} написав(ла):
                </p>
                <p className="text-text-secondary text-sm line-clamp-3 whitespace-pre-wrap">
                  {post.quotedPostContent}
                </p>
              </div>
            )}

            <div className="flex gap-4">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-sm overflow-hidden">
                  {post.authorAvatarUrl
                    ? <img src={post.authorAvatarUrl} alt={post.authorUsername} className="w-full h-full object-cover" />
                    : post.authorUsername[0]?.toUpperCase()
                  }
                </div>
                <span className="text-text-muted text-xs">#{(page - 1) * PAGE_SIZE + index + 1}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Link
                      to={ROUTES.USER_PROFILE.replace(':userId', post.authorId)}
                      className="font-semibold text-primary-400 hover:text-primary-300 transition-colors text-sm"
                    >
                      @{post.authorUsername}
                    </Link>
                    <span className="text-text-muted text-xs">{formatDate(post.createdAt)}</span>
                    {post.isEdited && (
                      <span className="text-text-muted text-xs italic">(відредаговано)</span>
                    )}
                  </div>

                  {/* Post actions */}
                  {post.content !== '[Повідомлення видалено]' && (
                    <div className="flex items-center gap-1">
                      {!thread.isLocked && user && (
                        <button
                          onClick={() => handleQuote(post)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-primary-400 hover:bg-surface-2 transition-colors"
                          title="Цитувати"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                        </button>
                      )}
                      {post.isOwn && (
                        <button
                          onClick={() => startEdit(post)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
                          title="Редагувати"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                      {(post.isOwn || (isModerator ?? false)) && (
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Видалити"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Edit mode */}
                {editingPostId === post.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-text-primary focus:outline-none focus:border-primary-500 resize-none text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(post.id)}
                        disabled={!editContent.trim()}
                        className="px-4 py-1.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
                      >
                        Зберегти
                      </button>
                      <button
                        onClick={() => setEditingPostId(null)}
                        className="px-4 py-1.5 text-text-secondary hover:text-text-primary text-sm transition-colors"
                      >
                        Скасувати
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-text-primary text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {post.content}
                  </p>
                )}

                {/* Reactions */}
                {post.content !== '[Повідомлення видалено]' && editingPostId !== post.id && (
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => handleReact(post, true)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm transition-colors ${
                        post.userReaction === true
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-surface-2 text-text-muted hover:text-green-400 hover:bg-green-500/10'
                      } ${!user ? 'cursor-default' : ''}`}
                      disabled={!user}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                      {post.likeCount > 0 && <span>{post.likeCount}</span>}
                    </button>
                    <button
                      onClick={() => handleReact(post, false)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm transition-colors ${
                        post.userReaction === false
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-surface-2 text-text-muted hover:text-red-400 hover:bg-red-500/10'
                      } ${!user ? 'cursor-default' : ''}`}
                      disabled={!user}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                      </svg>
                      {post.dislikeCount > 0 && <span>{post.dislikeCount}</span>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 my-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg bg-surface-1 border border-border text-text-secondary hover:text-text-primary disabled:opacity-40 text-sm"
          >
            ←
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const p = totalPages <= 7 ? i + 1 : (page <= 4 ? i + 1 : page - 3 + i);
            return p >= 1 && p <= totalPages ? (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                  p === page ? 'bg-primary-500 border-primary-500 text-white' : 'bg-surface-1 border-border text-text-secondary hover:text-text-primary'
                }`}
              >
                {p}
              </button>
            ) : null;
          })}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg bg-surface-1 border border-border text-text-secondary hover:text-text-primary disabled:opacity-40 text-sm"
          >
            →
          </button>
        </div>
      )}

      {/* Reply form */}
      {user && !thread.isLocked ? (
        <div className="bg-surface-1 border border-border rounded-xl p-5 mt-4">
          <h3 className="text-base font-semibold text-text-primary mb-4">Ваша відповідь</h3>

          {/* Quote preview */}
          {quotedPost && (
            <div className="mb-3 pl-3 border-l-2 border-primary-500/40 bg-surface-2/60 rounded-r-lg px-3 py-2 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-primary-400 font-medium mb-0.5">
                  Цитата @{quotedPost.authorUsername}:
                </p>
                <p className="text-text-secondary text-sm line-clamp-2 whitespace-pre-wrap">{quotedPost.content}</p>
              </div>
              <button
                onClick={() => setQuotedPost(null)}
                className="text-text-muted hover:text-text-primary flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <textarea
            ref={replyRef}
            value={replyContent}
            onChange={e => setReplyContent(e.target.value)}
            placeholder="Напишіть відповідь..."
            rows={5}
            className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-text-primary focus:outline-none focus:border-primary-500 resize-none mb-3"
          />

          {replyError && (
            <p className="text-red-400 text-sm mb-3 bg-red-500/10 rounded-lg px-3 py-2">{replyError}</p>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleReply}
              disabled={submitting || !replyContent.trim()}
              className="px-6 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {submitting ? 'Публікація...' : 'Відповісти'}
            </button>
          </div>
        </div>
      ) : thread.isLocked ? (
        <div className="mt-4 text-center py-4 bg-surface-1 border border-border rounded-xl text-text-muted text-sm flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          Тред заблоковано — нові відповіді не приймаються
        </div>
      ) : (
        <div className="mt-4 text-center py-4 bg-surface-1 border border-border rounded-xl text-text-muted text-sm">
          <Link to={ROUTES.LOGIN} className="text-primary-400 hover:underline">Увійдіть</Link>, щоб залишити відповідь
        </div>
      )}
    </div>
  );
};
