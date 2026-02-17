import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../../app/store/hooks';
import type { Review, ReviewComment } from '../../../core/types';
import { ReactionType } from '../../../core/types/enums';
import { reviewsApi } from '../../../core/api';
import { IconButton, Button } from '../../../shared/components';
import { ReviewForm } from './ReviewForm';

function formatRelativeTime(input: string | Date): string {
  const now = Date.now();
  const t = typeof input === 'string' ? new Date(input).getTime() : input.getTime();
  const diffSec = Math.floor((now - t) / 1000);
  if (diffSec < 60) return 'щойно';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} хв тому`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} год тому`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} дн тому`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} міс тому`;
  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} р тому`;
}

interface ReviewCardProps {
  review: Review;
  titleId: string;
  onUpdate: (review: Review) => void;
  onDelete: (reviewId: string) => void;
  onLoginRequired: () => void;
}

export function ReviewCard({ review, titleId, onUpdate, onDelete, onLoginRequired }: ReviewCardProps) {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [editing, setEditing] = useState(false);
  const [currentReview, setCurrentReview] = useState(review);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');

  const isOwner = user?.id === currentReview.userId;

  const handleReaction = async (type: ReactionType) => {
    if (!isAuthenticated) {
      onLoginRequired();
      return;
    }

    const updated = await reviewsApi.setReaction(titleId, currentReview.id, { type });
    setCurrentReview(updated);
    onUpdate(updated);
  };

  const handleUpdate = async (content: string, rating: number) => {
    const updated = await reviewsApi.update(titleId, currentReview.id, { content, rating });
    setCurrentReview(updated);
    onUpdate(updated);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (confirm('Ви впевнені, що хочете видалити цю рецензію?')) {
      await reviewsApi.delete(titleId, currentReview.id);
      onDelete(currentReview.id);
    }
  };

  async function submitReply() {
    if (!isAuthenticated) { onLoginRequired(); return; }
    const text = replyText.trim();
    if (!text) return;
    const created = await reviewsApi.addComment(titleId, currentReview.id, { content: text });
    const updated: Review = {
      ...currentReview,
      comments: [created, ...(currentReview.comments ?? [])],
    };
    setCurrentReview(updated);
    onUpdate(updated);
    setReplyText('');
    setShowReply(false);
  }

  const toggleReply = () => {
    if (!isAuthenticated) { onLoginRequired(); return; }
    setShowReply(v => !v);
  };

  async function submitChildReply(target: ReviewComment, text: string) {
    const content = text.trim();
    if (!content) return;
    const created = await reviewsApi.addComment(titleId, currentReview.id, { content, parentCommentId: target.id });
    const addUnderParent = (items: ReviewComment[]): ReviewComment[] => {
      return items.map(c => {
        if (c.id === target.id) {
          const nextReplies = [...(c.replies ?? []), created];
          return { ...c, replies: nextReplies };
        }
        if (c.replies && c.replies.length > 0) {
          return { ...c, replies: addUnderParent(c.replies) };
        }
        return c;
      });
    };
    const nextComments = addUnderParent(currentReview.comments ?? []);
    const updatedReview = { ...currentReview, comments: nextComments };
    setCurrentReview(updatedReview);
    onUpdate(updatedReview);
  }

  function CommentItem({ comment }: { comment: ReviewComment }) {
    const [showChildReply, setShowChildReply] = useState(false);
    const [childText, setChildText] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.content);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuContainerRef = useRef<HTMLDivElement | null>(null);
        useEffect(() => {
          if (!menuOpen) return;
          const onDown = (e: MouseEvent) => {
            const el = menuContainerRef.current;
            if (el && !el.contains(e.target as Node)) {
              setMenuOpen(false);
            }
          };
          const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMenuOpen(false);
          };
          document.addEventListener('mousedown', onDown);
          document.addEventListener('keydown', onKey);
          return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
          };
        }, [menuOpen]);
    const { user, isAuthenticated } = useAppSelector((state) => state.auth);
    const isOwner = user?.id === comment.userId;
    const handleReplyClick = () => {
      if (!isAuthenticated) { onLoginRequired(); return; }
      setShowChildReply(v => !v);
    };
    const sendChild = async () => {
      await submitChildReply(comment, childText);
      setChildText('');
      setShowChildReply(false);
    };
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-surface-600 flex items-center justify-center">
            {comment.avatarUrl ? (
              <Link to={`/users/${comment.userId}`}>
                <img src={comment.avatarUrl} alt={comment.username} className="w-8 h-8 rounded-full" />
              </Link>
            ) : (
              <Link to={`/users/${comment.userId}`} className="text-sm font-medium text-text-primary hover:underline">
                {comment.username[0].toUpperCase()}
              </Link>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Link to={`/users/${comment.userId}`} className="text-sm font-medium text-text-primary hover:underline">{comment.username}</Link>
              <span className="text-xs text-text-muted">{formatRelativeTime(comment.createdAt)}</span>
            </div>
            {!isEditing ? (
              <p className="text-text-secondary whitespace-pre-line">{comment.content}</p>
            ) : (
              <div className="mt-2 bg-surface-700 rounded p-3">
                <textarea
                  className="w-full resize-y bg-surface-800 text-text-primary rounded p-2 placeholder-text-muted"
                  rows={3}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                />
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={async () => {
                    const text = editText.trim();
                    if (!text) return;
                    const updated = await reviewsApi.updateComment(titleId, currentReview.id, comment.id, { content: text });
                    const preserveReplies = (items: ReviewComment[], u: ReviewComment): ReviewComment[] => {
                      return items.map(c => {
                        if (c.id === u.id) {
                          return { ...u, replies: c.replies };
                        }
                        if (c.replies && c.replies.length > 0) {
                          return { ...c, replies: preserveReplies(c.replies, u) };
                        }
                        return c;
                      });
                    };
                    const nextComments = preserveReplies(currentReview.comments ?? [], updated);
                    const updatedReview = { ...currentReview, comments: nextComments };
                    setCurrentReview(updatedReview);
                    onUpdate(updatedReview);
                    setIsEditing(false);
                  }}>Зберегти</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setEditText(comment.content); }}>Скасувати</Button>
                </div>
              </div>
            )}
            <div className="mt-2 flex items-center gap-2">
              <IconButton
                variant="like"
                active={comment.userReaction === ReactionType.Like}
                count={comment.likesCount}
                onClick={async () => {
                  if (!isAuthenticated) { onLoginRequired(); return; }
                  if (comment.userReaction === ReactionType.Like) {
                    await reviewsApi.removeCommentReaction(titleId, currentReview.id, comment.id);
                    const updatedLocal: ReviewComment = {
                      ...comment,
                      userReaction: undefined,
                      likesCount: Math.max(0, comment.likesCount - 1),
                    };
                    const preserveReplies = (items: ReviewComment[], u: ReviewComment): ReviewComment[] => {
                      return items.map(c => {
                        if (c.id === u.id) {
                          return { ...u, replies: c.replies };
                        }
                        if (c.replies && c.replies.length > 0) {
                          return { ...c, replies: preserveReplies(c.replies, u) };
                        }
                        return c;
                      });
                    };
                    const nextComments = preserveReplies(currentReview.comments ?? [], updatedLocal);
                    const updatedReview = { ...currentReview, comments: nextComments };
                    setCurrentReview(updatedReview);
                    onUpdate(updatedReview);
                  } else {
                    const updated = await reviewsApi.setCommentReaction(titleId, currentReview.id, comment.id, { type: ReactionType.Like });
                    const preserveReplies = (items: ReviewComment[], u: ReviewComment): ReviewComment[] => {
                      return items.map(c => {
                        if (c.id === u.id) {
                          return { ...u, replies: c.replies };
                        }
                        if (c.replies && c.replies.length > 0) {
                          return { ...c, replies: preserveReplies(c.replies, u) };
                        }
                        return c;
                      });
                    };
                    const nextComments = preserveReplies(currentReview.comments ?? [], updated);
                    const updatedReview = { ...currentReview, comments: nextComments };
                    setCurrentReview(updatedReview);
                    onUpdate(updatedReview);
                  }
                }}
                icon={<svg className="w-4 h-4" fill={comment.userReaction === ReactionType.Like ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>}
              />
              <IconButton
                variant="dislike"
                active={comment.userReaction === ReactionType.Dislike}
                count={comment.dislikesCount}
                onClick={async () => {
                  if (!isAuthenticated) { onLoginRequired(); return; }
                  if (comment.userReaction === ReactionType.Dislike) {
                    await reviewsApi.removeCommentReaction(titleId, currentReview.id, comment.id);
                    const updatedLocal: ReviewComment = {
                      ...comment,
                      userReaction: undefined,
                      dislikesCount: Math.max(0, comment.dislikesCount - 1),
                    };
                    const preserveReplies = (items: ReviewComment[], u: ReviewComment): ReviewComment[] => {
                      return items.map(c => {
                        if (c.id === u.id) {
                          return { ...u, replies: c.replies };
                        }
                        if (c.replies && c.replies.length > 0) {
                          return { ...c, replies: preserveReplies(c.replies, u) };
                        }
                        return c;
                      });
                    };
                    const nextComments = preserveReplies(currentReview.comments ?? [], updatedLocal);
                    const updatedReview = { ...currentReview, comments: nextComments };
                    setCurrentReview(updatedReview);
                    onUpdate(updatedReview);
                  } else {
                    const updated = await reviewsApi.setCommentReaction(titleId, currentReview.id, comment.id, { type: ReactionType.Dislike });
                    const preserveReplies = (items: ReviewComment[], u: ReviewComment): ReviewComment[] => {
                      return items.map(c => {
                        if (c.id === u.id) {
                          return { ...u, replies: c.replies };
                        }
                        if (c.replies && c.replies.length > 0) {
                          return { ...c, replies: preserveReplies(c.replies, u) };
                        }
                        return c;
                      });
                    };
                    const nextComments = preserveReplies(currentReview.comments ?? [], updated);
                    const updatedReview = { ...currentReview, comments: nextComments };
                    setCurrentReview(updatedReview);
                    onUpdate(updatedReview);
                  }
                }}
                icon={<svg className="w-4 h-4" fill={comment.userReaction === ReactionType.Dislike ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg>}
              />
            </div>
            <div className="mt-2 flex items-center gap-3">
              <Button size="sm" variant="primary" className="rounded-full" onClick={handleReplyClick}>Відповісти</Button>
              <Button size="sm" variant="primary" className="rounded-full" disabled>Скарга</Button>
              {isOwner && (
                <div className="relative ml-1" ref={menuContainerRef}>
                  <button
                    aria-label="Опції"
                    className="px-1 py-0.5 rounded hover:bg-neutral-900 text-text-muted"
                    onClick={() => setMenuOpen(v => !v)}
                  >
                    ...
                  </button>
                  {menuOpen && (
                    <div className="absolute left-full ml-2 mt-2 w-44 rounded-md bg-black text-white border border-neutral-800 shadow-2xl z-50">
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-neutral-900 flex items-center gap-2"
                        onClick={() => { setIsEditing(true); setEditText(comment.content); setMenuOpen(false); }}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
                        <span>Редагувати</span>
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-neutral-900 flex items-center gap-2 text-red-400"
                        onClick={async () => {
                          if (!isAuthenticated) { onLoginRequired(); return; }
                          await reviewsApi.deleteComment(titleId, currentReview.id, comment.id);
                          const removeFromTree = (items: ReviewComment[], id: string): ReviewComment[] => {
                            return items
                              .filter(c => c.id !== id)
                              .map(c => ({ ...c, replies: c.replies ? removeFromTree(c.replies, id) : [] }));
                          };
                          const next = removeFromTree(currentReview.comments ?? [], comment.id);
                          const updatedReview = { ...currentReview, comments: next };
                          setCurrentReview(updatedReview);
                          onUpdate(updatedReview);
                          setMenuOpen(false);
                        }}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                        <span>Видалити</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {showChildReply && (
              <div className="mt-2 bg-surface-700 rounded p-3">
                <textarea
                  className="w-full resize-y bg-surface-800 text-text-primary rounded p-2 placeholder-text-muted"
                  rows={2}
                  placeholder="Напишіть відповідь..."
                  value={childText}
                  onChange={(e) => setChildText(e.target.value)}
                />
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={sendChild}>Надіслати</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowChildReply(false); setChildText(''); }}>Скасувати</Button>
                </div>
              </div>
            )}
          </div>
        </div>
        {(comment.replies ?? []).length > 0 && (
          <div className="mt-2 pl-6 relative space-y-3">
            <div className="absolute left-0 top-1 bottom-1 w-[2px] rounded-full bg-gradient-to-b from-white/70 via-white/40 to-white/10 pointer-events-none"></div>
            {comment.replies!.map((rep) => (
              <CommentItem key={rep.id} comment={rep} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (editing) {
    return (
      <div className="bg-surface-800 rounded-lg p-4">
        <ReviewForm
          onSubmit={handleUpdate}
          initialContent={currentReview.content}
          initialRating={currentReview.rating}
          submitLabel="Зберегти"
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="bg-surface-800 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-600 flex items-center justify-center">
            {currentReview.avatarUrl ? (
              <Link to={`/users/${currentReview.userId}`}>
                <img
                  src={currentReview.avatarUrl}
                  alt={currentReview.username}
                  className="w-10 h-10 rounded-full"
                />
              </Link>
            ) : (
              <Link to={`/users/${currentReview.userId}`} className="text-lg font-medium text-text-primary hover:underline">
                {currentReview.username[0].toUpperCase()}
              </Link>
            )}
          </div>
          <div>
            <Link to={`/users/${currentReview.userId}`} className="font-medium text-text-primary hover:underline">{currentReview.username}</Link>
            <p className="text-sm text-text-muted">
              {new Date(currentReview.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-primary-500/20 text-primary-400 rounded text-sm font-medium">
            {currentReview.rating}/10
          </span>
          {isOwner && (
            <>
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                Редагувати
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDelete}>
                Видалити
              </Button>
            </>
          )}
        </div>
      </div>
      <p className="mt-4 text-text-secondary whitespace-pre-line">{currentReview.content}</p>

      {/* Лайки/дизлайки головної рецензії — під текстом і над кнопками */}
      <div className="mt-3 flex items-center gap-2">
        <IconButton
          variant="like"
          active={currentReview.userReaction === ReactionType.Like}
          count={currentReview.likesCount}
          onClick={() => handleReaction(ReactionType.Like)}
          icon={
            <svg className="w-4 h-4" fill={currentReview.userReaction === ReactionType.Like ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
          }
        />
        <IconButton
          variant="dislike"
          active={currentReview.userReaction === ReactionType.Dislike}
          count={currentReview.dislikesCount}
          onClick={() => handleReaction(ReactionType.Dislike)}
          icon={
            <svg className="w-4 h-4" fill={currentReview.userReaction === ReactionType.Dislike ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
            </svg>
          }
        />
      </div>

      {/* Кнопки під коментарем: Відповісти та Скарга (неробоча) */}
      <div className="mt-3 flex items-center gap-3">
        <Button size="sm" variant="primary" className="rounded-full" onClick={toggleReply}>
          Відповісти
        </Button>
        <Button size="sm" variant="primary" className="rounded-full" disabled>
          Скарга
        </Button>
      </div>

      {showReply && (
        <div className="mt-3 bg-surface-700 rounded p-3">
          <textarea
            className="w-full resize-y bg-surface-800 text-text-primary rounded p-2 placeholder-text-muted"
            rows={3}
            placeholder="Напишіть відповідь..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={submitReply}>Надіслати</Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowReply(false); setReplyText(''); }}>Скасувати</Button>
          </div>
        </div>
      )}

      {(currentReview.comments ?? []).length > 0 && (
        <div className="mt-4 pl-4 border-l-2 border-surface-600 space-y-3">
          {currentReview.comments!.map((rep: ReviewComment) => (
            <CommentItem key={rep.id} comment={rep} />
          ))}
        </div>
      )}
      
    </div>
  );
}
