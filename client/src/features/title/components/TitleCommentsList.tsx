import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { titleCommentsApi } from '../../../core/api/titleComments';
import type { ReviewComment } from '../../../core/types';
import { ReactionType, ReportTargetType } from '../../../core/types/enums';
import { useAppSelector } from '../../../app/store/hooks';
import { Button, IconButton, ReportButton } from '../../../shared/components';

interface TitleCommentsListProps {
  titleId: string;
  onLoginRequired: () => void;
}

function sortByDateDesc(comments: ReviewComment[]): ReviewComment[] {
  return [...comments].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

function buildTree(items: ReviewComment[]): ReviewComment[] {
  const cloned = items.map((item) => ({ ...item, replies: item.replies ? buildTree(item.replies) : [] }));
  return sortByDateDesc(cloned);
}

function updateCommentInTree(items: ReviewComment[], commentId: string, updater: (comment: ReviewComment) => ReviewComment): ReviewComment[] {
  return items.map((comment) => {
    if (comment.id === commentId) {
      return updater(comment);
    }

    if (comment.replies?.length) {
      return { ...comment, replies: updateCommentInTree(comment.replies, commentId, updater) };
    }

    return comment;
  });
}

function removeCommentFromTree(items: ReviewComment[], commentId: string): ReviewComment[] {
  return items
    .filter((comment) => comment.id !== commentId)
    .map((comment) => ({
      ...comment,
      replies: comment.replies?.length ? removeCommentFromTree(comment.replies, commentId) : [],
    }));
}

function insertReplyIntoTree(items: ReviewComment[], parentId: string, reply: ReviewComment): ReviewComment[] {
  return items.map((comment) => {
    if (comment.id === parentId) {
      return {
        ...comment,
        replies: [reply, ...(comment.replies ?? [])],
      };
    }

    if (comment.replies?.length) {
      return { ...comment, replies: insertReplyIntoTree(comment.replies, parentId, reply) };
    }

    return comment;
  });
}

function mergeCommentReaction(existing: ReviewComment, updated: ReviewComment): ReviewComment {
  return {
    ...existing,
    ...updated,
    replies: existing.replies ?? updated.replies ?? [],
  };
}

function CommentTree({
  comments,
  titleId,
  level = 0,
  replyingTo,
  draftText,
  onReply,
  onDraftChange,
  onSubmitReply,
  isSubmitting,
  onUpdateComment,
  onReactComment,
  onDeleteComment,
  onReloadRequested,
  onLoginRequired,
}: {
  comments: ReviewComment[];
  titleId: string;
  level?: number;
  replyingTo: string | null;
  draftText: Record<string, string>;
  onReply: (commentId: string) => void;
  onDraftChange: (commentId: string, text: string) => void;
  onSubmitReply: (parentId: string) => Promise<void>;
  isSubmitting: string | null;
  onUpdateComment: (commentId: string, content: string) => Promise<void>;
  onReactComment: (commentId: string, updated: ReviewComment) => void;
  onDeleteComment: (commentId: string) => Promise<void>;
  onReloadRequested: () => Promise<void>;
  onLoginRequired: () => void;
}) {
  if (!comments.length) return null;

  const ordered = sortByDateDesc(comments);

  return (
    <div className="space-y-4">
      {ordered.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          titleId={titleId}
          level={level}
          replyingTo={replyingTo}
          draftText={draftText}
          onReply={onReply}
          onDraftChange={onDraftChange}
          onSubmitReply={onSubmitReply}
          isSubmitting={isSubmitting}
          onUpdateComment={onUpdateComment}
          onReactComment={onReactComment}
          onDeleteComment={onDeleteComment}
          onReloadRequested={onReloadRequested}
          onLoginRequired={onLoginRequired}
        />
      ))}
    </div>
  );
}

function formatRelativeTime(input: string | Date): string {
  const now = Date.now();
  const time = typeof input === 'string' ? new Date(input).getTime() : input.getTime();
  const diffSec = Math.floor((now - time) / 1000);
  if (diffSec < 60) return 'щойно';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} хв тому`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} год тому`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} дн тому`;
}

function CommentItem({
  comment,
  titleId,
  level,
  replyingTo,
  draftText,
  onReply,
  onDraftChange,
  onSubmitReply,
  isSubmitting,
  onUpdateComment,
  onReactComment,
  onDeleteComment,
  onReloadRequested,
  onLoginRequired,
}: {
  comment: ReviewComment;
  titleId: string;
  level: number;
  replyingTo: string | null;
  draftText: Record<string, string>;
  onReply: (commentId: string) => void;
  onDraftChange: (commentId: string, text: string) => void;
  onSubmitReply: (parentId: string) => Promise<void>;
  isSubmitting: string | null;
  onUpdateComment: (commentId: string, content: string) => Promise<void>;
  onReactComment: (commentId: string, updated: ReviewComment) => void;
  onDeleteComment: (commentId: string) => Promise<void>;
  onReloadRequested: () => Promise<void>;
  onLoginRequired: () => void;
}) {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const isOwner = user?.id === comment.userId;
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen]);

  const handleReaction = async (type: ReactionType) => {
    if (!isAuthenticated) {
      onLoginRequired();
      return;
    }

    if (comment.userReaction === type) {
      await titleCommentsApi.removeReaction(titleId, comment.id);
      onReactComment(comment.id, {
        ...comment,
        userReaction: undefined,
        likesCount: type === ReactionType.Like ? Math.max(0, comment.likesCount - 1) : comment.likesCount,
        dislikesCount: type === ReactionType.Dislike ? Math.max(0, comment.dislikesCount - 1) : comment.dislikesCount,
      });
      return;
    }

    const updated = await titleCommentsApi.setReaction(titleId, comment.id, { type });
    onReactComment(comment.id, updated);
  };

  const handleToggleReply = () => {
    if (!isAuthenticated) {
      onLoginRequired();
      return;
    }

    setShowReplyInput((value) => !value);
    onReply(comment.id);
  };

  const handleSubmitReply = async () => {
    await onSubmitReply(comment.id);
    setShowReplyInput(false);
  };

  const handleSaveEdit = async () => {
    const content = editText.trim();
    if (!content) return;

    await onUpdateComment(comment.id, content);
    setIsEditing(false);
    setMenuOpen(false);
  };

  const handleDelete = async () => {
    if (!confirm('Ви впевнені, що хочете видалити цей коментар?')) return;
    await onDeleteComment(comment.id);
    setMenuOpen(false);
  };

  return (
    <div
      id={`comment-${comment.id}`}
      className="flex flex-col gap-2 rounded-lg bg-surface-800 p-4"
      style={{ marginLeft: `${Math.min(level, 4) * 14}px` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {comment.avatarUrl ? (
            <img src={comment.avatarUrl} alt={comment.username} className="w-10 h-10 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-surface-600 flex items-center justify-center text-sm text-text-muted shrink-0">
              {comment.username[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link to={`/users/${comment.userId}`} className="text-sm font-medium text-text-primary hover:underline">
                {comment.username}
              </Link>
              <span className="text-xs text-text-muted">{formatRelativeTime(comment.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isOwner ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                aria-label="Опції коментаря"
                onClick={() => setMenuOpen((value) => !value)}
                className="rounded-full px-2 py-1 text-text-muted hover:text-text-primary hover:bg-surface-700 transition-colors"
              >
                ...
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-lg bg-black shadow-2xl z-20">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-900"
                    onClick={() => {
                      setIsEditing(true);
                      setEditText(comment.content);
                      setMenuOpen(false);
                    }}
                  >
                    <span>Редагувати</span>
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-surface-900"
                    onClick={handleDelete}
                  >
                    <span>Видалити</span>
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {isEditing ? (
        <div className="rounded-lg bg-surface-700 p-3">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg bg-surface-800 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-colors"
          />
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={handleSaveEdit}>Зберегти</Button>
            <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setEditText(comment.content); }}>
              Скасувати
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-text-secondary whitespace-pre-line leading-relaxed">{comment.content}</p>
      )}

      <div className="flex items-center gap-2 flex-wrap pt-1">
        <IconButton
          variant="like"
          active={comment.userReaction === ReactionType.Like}
          count={comment.likesCount}
          onClick={() => handleReaction(ReactionType.Like)}
          icon={
            <svg className="w-4 h-4" fill={comment.userReaction === ReactionType.Like ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
          }
        />
        <IconButton
          variant="dislike"
          active={comment.userReaction === ReactionType.Dislike}
          count={comment.dislikesCount}
          onClick={() => handleReaction(ReactionType.Dislike)}
          icon={
            <svg className="w-4 h-4" fill={comment.userReaction === ReactionType.Dislike ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
            </svg>
          }
        />
        <Button
          size="sm"
          variant="primary"
          className="rounded-full"
          onClick={handleToggleReply}
        >
          Відповісти
        </Button>
        <ReportButton
          targetType={ReportTargetType.TitleComment}
          targetId={comment.id}
          className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-primary-500 text-white hover:bg-primary-600 transition-colors text-sm font-medium"
          label="Скарга"
          showIcon={false}
        />
      </div>

      {showReplyInput && replyingTo === comment.id && (
        <div className="mt-1 rounded-lg bg-surface-700 p-3">
          <textarea
            value={draftText[comment.id] ?? ''}
            onChange={(e) => onDraftChange(comment.id, e.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg bg-surface-800 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-colors"
            placeholder="Напишіть відповідь..."
          />
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              onClick={handleSubmitReply}
              disabled={isSubmitting === comment.id || !(draftText[comment.id] ?? '').trim()}
            >
              {isSubmitting === comment.id ? '...' : 'Надіслати'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowReplyInput(false);
                onDraftChange(comment.id, '');
              }}
            >
              Скасувати
            </Button>
          </div>
        </div>
      )}

      {(comment.replies?.length ?? 0) > 0 && (
        <div className="mt-2 pl-4 border-l-2 border-surface-600/70 space-y-3">
          <CommentTree
            comments={comment.replies ?? []}
            titleId={titleId}
            level={level + 1}
            replyingTo={replyingTo}
            draftText={draftText}
            onReply={onReply}
            onDraftChange={onDraftChange}
            onSubmitReply={onSubmitReply}
            isSubmitting={isSubmitting}
            onUpdateComment={onUpdateComment}
            onReactComment={onReactComment}
            onDeleteComment={onDeleteComment}
            onReloadRequested={onReloadRequested}
            onLoginRequired={onLoginRequired}
          />
        </div>
      )}
    </div>
  );
}

export function TitleCommentsList({ titleId, onLoginRequired }: TitleCommentsListProps) {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [draftText, setDraftText] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [topLevelDraft, setTopLevelDraft] = useState('');

  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await titleCommentsApi.get(titleId);
      setComments(buildTree(data));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [titleId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const handleSubmitTopLevel = async () => {
    if (!isAuthenticated) {
      onLoginRequired();
      return;
    }

    const content = topLevelDraft.trim();
    if (!content) return;

    setIsSubmitting('top-level');
    try {
      const created = await titleCommentsApi.add(titleId, { content });
      setComments((prev) => [created, ...prev]);
      setTopLevelDraft('');
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleSubmitReply = async (parentCommentId: string) => {
    if (!isAuthenticated) {
      onLoginRequired();
      return;
    }

    const content = (draftText[parentCommentId] ?? '').trim();
    if (!content) return;

    setIsSubmitting(parentCommentId);
    try {
      const created = await titleCommentsApi.add(titleId, { 
        content,
        parentCommentId 
      });
      setComments((prev) => {
        return insertReplyIntoTree(prev, parentCommentId, created);
      });
      
      setDraftText((prev) => ({ ...prev, [parentCommentId]: '' }));
      setReplyingTo(null);
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleUpdateComment = async (commentId: string, content: string) => {
    const updated = await titleCommentsApi.update(titleId, commentId, { content });
    setComments((prev) => updateCommentInTree(prev, commentId, () => ({ ...updated })));
  };

  const handleDeleteComment = async (commentId: string) => {
    await titleCommentsApi.delete(titleId, commentId);
    setComments((prev) => removeCommentFromTree(prev, commentId));
  };

  return (
    <div className="space-y-4">
      {/* Top-level comment input */}
      {isAuthenticated ? (
        <div className="rounded-lg bg-surface-800 p-4 border border-white/10">
          <textarea
            value={topLevelDraft}
            onChange={(e) => setTopLevelDraft(e.target.value)}
            rows={3}
            className="w-full bg-surface-700 rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted resize-none border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-colors"
            placeholder="Поділіться своєю думкою про цей твір..."
          />
          <div className="mt-2 flex justify-end">
            <Button
              size="sm"
              variant="primary"
              className="rounded-full"
              onClick={handleSubmitTopLevel}
              disabled={isSubmitting === 'top-level' || !topLevelDraft.trim()}
            >
              {isSubmitting === 'top-level' ? '...' : 'Надіслати'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-text-secondary rounded-lg bg-surface-800 p-4">
          <button type="button" onClick={onLoginRequired} className="text-primary-400 hover:underline">
            Увійдіть
          </button>{' '}
          щоб брати участь у дискусії
        </div>
      )}

      {/* Comments tree */}
      {comments.length > 0 ? (
        <CommentTree
          comments={comments}
          titleId={titleId}
          onReply={setReplyingTo}
          replyingTo={replyingTo}
          draftText={draftText}
          onDraftChange={(id, text) => setDraftText((prev) => ({ ...prev, [id]: text }))}
          onSubmitReply={handleSubmitReply}
          isSubmitting={isSubmitting}
          onUpdateComment={handleUpdateComment}
          onReactComment={(commentId, updated) => {
            setComments((prev) => updateCommentInTree(prev, commentId, (existing) => mergeCommentReaction(existing, updated)));
          }}
          onDeleteComment={handleDeleteComment}
          onReloadRequested={loadComments}
          onLoginRequired={onLoginRequired}
        />
      ) : (
        <p className="text-center text-text-muted py-8">Ще немає коментарів. Будьте першим!</p>
      )}
    </div>
  );
}
