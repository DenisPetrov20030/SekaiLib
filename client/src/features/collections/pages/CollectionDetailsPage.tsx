import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { collectionsApi } from '../../../core/api/collections';
import type { CollectionDetailsDto, CollectionCommentDto, CollectionItemDto } from '../../../core/api/collections';
import { useAppSelector } from '../../../app/store/hooks';
import { Button } from '../../../shared/components';
import { ROUTES } from '../../../core/constants';

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / 3_600_000);
  const diffD = Math.floor(diffMs / 86_400_000);
  if (diffH < 1) return 'щойно';
  if (diffH < 24) return `${diffH} год. тому`;
  if (diffD < 30) return `${diffD} д. тому`;
  return d.toLocaleDateString('uk-UA');
};

// ─── Title Card ───────────────────────────────────────────────────────────────

const TitleCard = ({ item, canEdit, onRemove, sections, currentSectionId, moving, onMove }: {
  item: CollectionItemDto;
  canEdit: boolean;
  onRemove?: (itemId: string) => void;
  sections?: Array<{ id: string; name: string }>;
  currentSectionId?: string | null;
  moving?: boolean;
  onMove?: (itemId: string, targetSectionId: string | null, currentSectionId: string | null) => void;
}) => (
  <div className="relative group flex flex-col h-full">
    <Link
      to={ROUTES.TITLE_DETAILS.replace(':id', item.titleId)}
      className="block rounded-lg overflow-hidden border border-divider hover:border-white/20 transition-all flex-1 flex flex-col"
    >
      <div className="flex-none aspect-[2/3] bg-surface-hover overflow-hidden">
        {item.coverImageUrl ? (
          <img
            src={item.coverImageUrl}
            alt={item.titleName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-10 h-10 text-text-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-2 flex-none">
        <p className="text-xs font-medium text-text-primary line-clamp-2 leading-tight">
          {item.titleName}
        </p>
      </div>
    </Link>
    {canEdit && onRemove && (
      <button
        onClick={() => onRemove(item.id)}
        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-500/80 text-white text-xs hidden group-hover:flex items-center justify-center hover:bg-red-500 transition-all"
        title="Видалити з колекції"
      >
        ✕
      </button>
    )}
    {canEdit && onMove && sections && sections.length > 0 && (
      <div className="mt-auto w-full">
        <select
          disabled={moving}
          value={currentSectionId ?? ''}
          onChange={(e) => onMove(item.id, e.target.value || null, currentSectionId ?? null)}
          className="w-full rounded-md border border-divider bg-surface px-2 py-1 text-xs text-text-secondary outline-none focus:border-primary-500"
        >
          <option value="">Інші тайтли</option>
          {sections.map((section) => (
            <option key={section.id} value={section.id}>{section.name}</option>
          ))}
        </select>
      </div>
    )}
  </div>
);

// ─── Comment ─────────────────────────────────────────────────────────────────

const CommentItem = ({ comment, currentUserId, collectionId, onDeleted, onReply, onAnyCommentDeleted }: {
  comment: CollectionCommentDto;
  currentUserId?: string;
  collectionId: string;
  onDeleted: (id: string) => void;
  onReply: (commentId: string, username: string) => void;
  onAnyCommentDeleted?: () => void;
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<CollectionCommentDto[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const handleShowReplies = async () => {
    if (showReplies) { setShowReplies(false); return; }
    try {
      setLoadingReplies(true);
      const data = await collectionsApi.getReplies(collectionId, comment.id);
      setReplies(data);
      setShowReplies(true);
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Видалити коментар?')) return;
    try {
      await collectionsApi.deleteComment(collectionId, comment.id);
      onDeleted(comment.id);
      try { onAnyCommentDeleted?.(); } catch {}
    } catch { }
  };

  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 h-9 w-9 rounded-full bg-surface-hover flex items-center justify-center overflow-hidden">
        {comment.authorAvatarUrl
          ? <img src={comment.authorAvatarUrl} alt="" className="w-full h-full object-cover" />
          : <span className="text-xs font-bold text-text-muted">{comment.authorUsername.charAt(0).toUpperCase()}</span>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-semibold text-text-primary">{comment.authorUsername}</span>
          <span className="text-xs text-text-muted">{formatTime(comment.createdAt)}</span>
        </div>
        <p className="text-sm text-text-secondary mt-1 whitespace-pre-wrap break-words">{comment.content}</p>
        <div className="flex items-center gap-3 mt-2">
          {currentUserId && (
            <Button size="sm" variant="primary" className="rounded-full" onClick={() => onReply(comment.id, comment.authorUsername)}>
              відповісти
            </Button>
          )}
          {comment.replyCount > 0 && (
            <button
              onClick={handleShowReplies}
              className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
            >
              {loadingReplies ? '...' : showReplies ? 'сховати відповіді' : `${comment.replyCount} відповідей`}
            </button>
          )}
          {comment.authorId === currentUserId && (
            <Button size="sm" variant="ghost" className="ml-auto text-red-400 hover:text-red-300" onClick={handleDelete}>
              видалити
            </Button>
          )}
        </div>
            {showReplies && replies.length > 0 && (
          <div className="mt-3 space-y-3 pl-3 border-l border-divider">
            {replies.map((r) => (
              <CommentItem
                key={r.id}
                comment={r}
                currentUserId={currentUserId}
                collectionId={collectionId}
                    onDeleted={(rid) => setReplies((prev) => prev.filter((x) => x.id !== rid))}
                    onReply={onReply}
                    onAnyCommentDeleted={onAnyCommentDeleted}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const CollectionDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAppSelector((s) => s.auth.user);

  const [collection, setCollection] = useState<CollectionDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  // Add section
  const [newSectionName, setNewSectionName] = useState('');
  const [addingSect, setAddingSect] = useState(false);
  const [movingItemId, setMovingItemId] = useState<string | null>(null);

  // Comments
  const [comments, setComments] = useState<CollectionCommentDto[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
  const [sendingComment, setSendingComment] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Menu
  const [menuOpen, setMenuOpen] = useState(false);

  const isOwner = currentUser?.id === collection?.authorId;

  const loadCollection = async (collectionId: string) => {
    const [col, cmts] = await Promise.all([
      collectionsApi.getById(collectionId),
      collectionsApi.getComments(collectionId),
    ]);

    setCollection(col);
    setComments(cmts);
    setEditTitle(col.title);
    setEditDescription(col.description ?? '');
    setEditIsPublic(col.isPublic);
  };

  const reloadComments = async () => {
    if (!id) return;
    try {
      const data = await collectionsApi.getComments(id);
      setComments(data);
    } catch {}
  };

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        await loadCollection(id);
      } catch {
        setError('Колекцію не знайдено або доступ заборонено.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSaveEdit = async () => {
    if (!collection || !id) return;
    try {
      setSaving(true);
      const updated = await collectionsApi.update(id, {
        title: editTitle,
        description: editDescription || undefined,
        isPublic: editIsPublic,
      });
      setCollection(updated);
      setIsEditing(false);
    } catch (err: any) {
      alert(err?.message ?? 'Помилка збереження.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Видалити колекцію? Цю дію не можна скасувати.')) return;
    try {
      await collectionsApi.delete(id);
      navigate(ROUTES.COLLECTIONS);
    } catch (err: any) {
      alert(err?.message ?? 'Помилка видалення.');
    }
  };

  const handleAddSection = async () => {
    if (!id || !newSectionName.trim()) return;
    try {
      setAddingSect(true);
      const section = await collectionsApi.addSection(id, newSectionName.trim());
      setCollection((prev) => prev ? { ...prev, sections: [...prev.sections, { ...section, items: [] }] } : prev);
      setNewSectionName('');
    } catch { } finally {
      setAddingSect(false);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!id || !confirm('Видалити розділ? Тайтли перейдуть до загального списку.')) return;
    try {
      setLoading(true);
      await collectionsApi.deleteSection(id, sectionId);

      setCollection((prev) => {
        if (!prev) return prev;
        const removed = prev.sections.find((s) => s.id === sectionId);
        const removedItems = removed ? removed.items : [];
        return {
          ...prev,
          sections: prev.sections.filter((s) => s.id !== sectionId),
          uncategorizedItems: [...prev.uncategorizedItems, ...removedItems],
        };
      });
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? 'Помилка видалення розділу.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!id) return;
    await collectionsApi.removeItem(id, itemId);
    setCollection((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map((s) => ({ ...s, items: s.items.filter((i) => i.id !== itemId) })),
        uncategorizedItems: prev.uncategorizedItems.filter((i) => i.id !== itemId),
      };
    });
  };

  const handleMoveItem = async (itemId: string, targetSectionId: string | null, currentSectionId: string | null) => {
    if (!id || targetSectionId === currentSectionId) return;

    try {
      setMovingItemId(itemId);
      await collectionsApi.updateItemSection(id, itemId, targetSectionId ?? undefined);

      setCollection((prev) => {
        if (!prev) return prev;

        let movingItem: CollectionItemDto | null = null;

        const nextSections = prev.sections.map((section) => {
          const idx = section.items.findIndex((item) => item.id === itemId);
          if (idx === -1) return section;

          movingItem = section.items[idx];
          return {
            ...section,
            items: section.items.filter((item) => item.id !== itemId),
          };
        });

        let nextUncategorized = prev.uncategorizedItems;
        if (!movingItem) {
          const idx = prev.uncategorizedItems.findIndex((item) => item.id === itemId);
          if (idx !== -1) {
            movingItem = prev.uncategorizedItems[idx];
            nextUncategorized = prev.uncategorizedItems.filter((item) => item.id !== itemId);
          }
        } else {
          nextUncategorized = prev.uncategorizedItems.filter((item) => item.id !== itemId);
        }

        if (!movingItem) return prev;

        if (targetSectionId) {
          return {
            ...prev,
            sections: nextSections.map((section) =>
              section.id === targetSectionId
                ? { ...section, items: [...section.items, movingItem as CollectionItemDto] }
                : section
            ),
            uncategorizedItems: nextUncategorized,
          };
        }

        return {
          ...prev,
          sections: nextSections,
          uncategorizedItems: [...nextUncategorized, movingItem],
        };
      });
    } finally {
      setMovingItemId(null);
    }
  };

  const handleReact = async (isLike: boolean) => {
    if (!id || !currentUser) return;
    const current = collection?.userReaction;
    if (current === isLike) {
      await collectionsApi.removeReaction(id);
      setCollection((prev) => prev ? {
        ...prev,
        userReaction: null,
        likeCount: isLike ? prev.likeCount - 1 : prev.likeCount,
        dislikeCount: !isLike ? prev.dislikeCount - 1 : prev.dislikeCount,
      } : prev);
    } else {
      await collectionsApi.react(id, isLike);
      setCollection((prev) => {
        if (!prev) return prev;
        const wasLike = prev.userReaction === true;
        const wasDislike = prev.userReaction === false;
        return {
          ...prev,
          userReaction: isLike,
          likeCount: isLike ? prev.likeCount + 1 : wasLike ? prev.likeCount - 1 : prev.likeCount,
          dislikeCount: !isLike ? prev.dislikeCount + 1 : wasDislike ? prev.dislikeCount - 1 : prev.dislikeCount,
        };
      });
    }
  };

  const handleSendComment = async () => {
    if (!id || !commentText.trim()) return;
    try {
      setSendingComment(true);
      const comment = await collectionsApi.addComment(id, {
        content: commentText.trim(),
        parentCommentId: replyTo?.id,
      });
      if (replyTo) {
        setComments((prev) =>
          prev.map((c) => c.id === replyTo.id ? { ...c, replyCount: c.replyCount + 1 } : c)
        );
      } else {
        setComments((prev) => [comment, ...prev]);
      }
      setCommentText('');
      setReplyTo(null);
    } catch { } finally {
      setSendingComment(false);
    }
  };

  const handleSetReply = (commentId: string, username: string) => {
    setReplyTo({ id: commentId, username });
    commentInputRef.current?.focus();
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="h-8 w-64 bg-surface-hover rounded animate-pulse mb-4" />
        <div className="h-4 w-40 bg-surface-hover rounded animate-pulse mb-8" />
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-surface-hover rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <p className="text-text-muted">{error ?? 'Колекцію не знайдено.'}</p>
        <Link to={ROUTES.COLLECTIONS} className="text-primary-400 hover:underline text-sm mt-4 inline-block">
          ← Назад до колекцій
        </Link>
      </div>
    );
  }

  const allItems = [
    ...collection.sections.flatMap((s) => s.items),
    ...collection.uncategorizedItems,
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <Link
        to={ROUTES.COLLECTIONS}
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
      >
        ← Колекції
      </Link>

      {/* Header */}
      {isEditing ? (
        <div className="bg-surface rounded-xl border border-divider p-6 mb-6 space-y-4">
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full text-2xl font-bold bg-transparent border-b border-divider pb-2 text-text-primary outline-none focus:border-primary-500"
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-divider bg-background px-3 py-2 text-sm text-text-secondary outline-none focus:border-primary-500 resize-none"
            placeholder="Опис колекції..."
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={editIsPublic} onChange={(e) => setEditIsPublic(e.target.checked)} />
            <span className="text-sm text-text-secondary">Публічна</span>
          </label>
          <div className="flex gap-2">
            <Button onClick={handleSaveEdit} disabled={saving}>{saving ? 'Збереження...' : 'Зберегти'}</Button>
            <Button variant="secondary" onClick={() => setIsEditing(false)}>Скасувати</Button>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-text-primary break-words">{collection.title}</h1>
              {collection.description && (
                <p className="text-text-muted mt-2 text-sm whitespace-pre-wrap">{collection.description}</p>
              )}
            </div>

            {/* Menu */}
            {isOwner && (
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="px-3 py-2 rounded-md border border-divider text-text-muted hover:text-text-primary hover:bg-surface-hover transition-all"
                >
                  •••
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 z-20 w-40 rounded-lg border border-divider bg-surface shadow-xl py-1">
                    <button
                      onClick={() => { setMenuOpen(false); setIsEditing(true); }}
                      className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                    >
                      Редагувати
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); handleDelete(); }}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                    >
                      Видалити
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Author + stats */}
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <Link
              to={ROUTES.USER_PROFILE.replace(':userId', collection.authorId)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              {collection.authorAvatarUrl ? (
                <img src={collection.authorAvatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <div className="h-7 w-7 rounded-full bg-surface-hover flex items-center justify-center text-xs font-bold text-text-muted">
                  {collection.authorUsername.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium text-text-primary">{collection.authorUsername}</span>
            </Link>
            <span className="text-text-muted text-sm">{formatTime(collection.createdAt)}</span>

            <div className="flex items-center gap-3 ml-auto text-sm text-text-muted">
              <span title="Перегляди" className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                {collection.viewCount}
              </span>
              <span title="Коментарі" className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                {collection.commentCount}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Add section (owner) */}
      {isOwner && (
        <div className="flex gap-2 mb-6">
          <input
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            placeholder="Назва нового розділу..."
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddSection(); }}
            className="flex-1 rounded-md border border-divider bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-primary-500 transition-colors"
          />
          <Button variant="secondary" onClick={handleAddSection} disabled={addingSect || !newSectionName.trim()}>
            + Розділ
          </Button>
        </div>
      )}

      {/* Sections */}
      {collection.sections.map((section) => (
        <div key={section.id} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-text-primary">{section.name}</h2>
            {isOwner && (
              <button
                onClick={() => handleDeleteSection(section.id)}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Видалити розділ
              </button>
            )}
          </div>
          {section.items.length === 0 ? (
            <p className="text-sm text-text-muted italic">Розділ порожній</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3 auto-rows-fr">
              {section.items.map((item) => (
                <TitleCard
                  key={item.id}
                  item={item}
                  canEdit={isOwner}
                  onRemove={handleRemoveItem}
                  sections={collection.sections.map((s) => ({ id: s.id, name: s.name }))}
                  currentSectionId={section.id}
                  moving={movingItemId === item.id}
                  onMove={handleMoveItem}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Uncategorized items */}
      {collection.uncategorizedItems.length > 0 && (
        <div className="mb-8">
          {collection.sections.length > 0 && (
            <h2 className="text-xl font-semibold text-text-primary mb-4">Інші тайтли</h2>
          )}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3 auto-rows-fr">
            {collection.uncategorizedItems.map((item) => (
              <TitleCard
                key={item.id}
                item={item}
                canEdit={isOwner}
                onRemove={handleRemoveItem}
                sections={collection.sections.map((s) => ({ id: s.id, name: s.name }))}
                currentSectionId={null}
                moving={movingItemId === item.id}
                onMove={handleMoveItem}
              />
            ))}
          </div>
        </div>
      )}

      {allItems.length === 0 && (
        <div className="rounded-xl border border-dashed border-divider px-6 py-12 text-center mb-8">
          <p className="text-text-muted">Колекція порожня</p>
          {isOwner && <p className="text-text-muted text-sm mt-1">Додавайте тайтли зі сторінок тайтлів</p>}
        </div>
      )}

      {/* Reactions */}
      <div className="flex items-center gap-4 py-4 border-t border-b border-divider mb-8">
        <button
          onClick={() => handleReact(true)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
            collection.userReaction === true
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              : 'border-divider text-text-muted hover:border-emerald-500/40 hover:text-emerald-400'
          }`}
          disabled={!currentUser}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
          {collection.likeCount}
        </button>
        <button
          onClick={() => handleReact(false)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
            collection.userReaction === false
              ? 'bg-red-500/20 border-red-500/40 text-red-300'
              : 'border-divider text-text-muted hover:border-red-500/40 hover:text-red-400'
          }`}
          disabled={!currentUser}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg>
          {collection.dislikeCount}
        </button>

        {!currentUser && (
          <span className="text-xs text-text-muted ml-auto">Увійдіть, щоб оцінити</span>
        )}
      </div>

      {/* Comments */}
      <div>
        <h2 className="text-xl font-semibold text-text-primary mb-5">
          {comments.length} {comments.length === 1 ? 'Коментар' : 'Коментарів'}
        </h2>

        {/* Comment input */}
        {currentUser && (
          <div className="mb-6">
            {replyTo && (
              <div className="flex items-center gap-2 mb-2 text-sm text-text-muted">
                <span>Відповідь до <strong className="text-text-secondary">{replyTo.username}</strong></span>
                <button onClick={() => setReplyTo(null)} className="text-xs hover:text-text-primary">✕</button>
              </div>
            )}
            <textarea
              ref={commentInputRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              placeholder="Написати коментар..."
              className="w-full rounded-md border border-divider bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary-500 transition-colors resize-none"
            />
            <div className="flex justify-end mt-2">
              <Button onClick={handleSendComment} disabled={sendingComment || !commentText.trim()}>
                {sendingComment ? 'Надсилання...' : 'Надіслати'}
              </Button>
            </div>
          </div>
        )}

        {/* Comments list */}
        <div className="space-y-5">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUser?.id}
              collectionId={collection.id}
              onDeleted={(cid) => setComments((prev) => prev.filter((c) => c.id !== cid))}
              onReply={handleSetReply}
              onAnyCommentDeleted={reloadComments}
            />
          ))}
          {comments.length === 0 && (
            <p className="text-text-muted text-sm">Коментарів ще немає. Будьте першим!</p>
          )}
        </div>
      </div>
    </div>
  );
};
