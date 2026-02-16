import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { fetchChapterContent, setTheme, setFontSize } from '../store';
import { ReaderTheme, ReaderFontSize, ReaderWidth } from '../../../core/types';
import { renderChapterContent } from '../../../shared/utils/textRender';
import { apiClient } from '../../../core/api';
import { chapterCommentsApi } from '../../../core/api/chapterComments';
import type { ReviewComment } from '../../../core/types';
import { ReactionType } from '../../../core/types/enums';
import { IconButton, Button } from '../../../shared/components';

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

export const ReaderPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const saveTimerRef = useRef<number | null>(null);
  const lastSavedPageRef = useRef<number>(-1);
  const [showGoToStart, setShowGoToStart] = useState(false);
  const { titleId, chapterNumber } = useParams<{ titleId: string; chapterNumber: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [comments, setComments] = useState<ReviewComment[]>([]);
    const dedupeTree = (items: ReviewComment[]): ReviewComment[] => {
      const seen = new Set<string>();
      const walk = (arr: ReviewComment[]): ReviewComment[] => {
        const out: ReviewComment[] = [];
        for (const c of arr) {
          if (seen.has(c.id)) continue;
          seen.add(c.id);
          const replies = c.replies ? walk(c.replies) : [];
          out.push({ ...c, replies });
        }
        return out;
      };
      return walk(items);
    };
    const removeFromTree = (items: ReviewComment[], targetId: string): ReviewComment[] => {
      const walk = (arr: ReviewComment[]): ReviewComment[] => {
        const out: ReviewComment[] = [];
        for (const c of arr) {
          if (c.id === targetId) continue;
          const replies = c.replies ? walk(c.replies) : [];
          out.push({ ...c, replies });
        }
        return out;
      };
      return walk(items);
    };
  const [newCommentText, setNewCommentText] = useState('');
  
  // Отримуємо дані про главу та налаштування зі стору
  const { currentChapter, settings, loading, error } = useAppSelector((state) => state.reader);
  // Отримуємо дані користувача для перевірки авторизації перед збереженням
  // auth стан не використовується для збереження прогресу

  // 1. Завантаження контенту глави при зміні параметрів URL
  useEffect(() => {
    if (titleId && chapterNumber) {
      dispatch(fetchChapterContent({ titleId, chapterNumber: parseInt(chapterNumber) }));
    }
  }, [dispatch, titleId, chapterNumber]);

  // Load chapter comments when chapter changes
  useEffect(() => {
    const loadComments = async () => {
      if (!currentChapter) return;
      const data = await chapterCommentsApi.get(currentChapter.id);
      setComments(dedupeTree(data));
    };
    loadComments();
  }, [currentChapter?.id]);

  // 2. ЗБЕРЕЖЕННЯ ПРОГРЕСУ ЧИТАННЯ
  // Викликається кожного разу, коли завантажується нова глава
  useEffect(() => {
    if (!currentChapter) return;

    const pageParam = searchParams.get('page');
    const paragraphs = Array.from(document.querySelectorAll<HTMLParagraphElement>('.novel-paragraph'));

    // Прокрутка до збереженої позиції
    if (pageParam) {
      const idx = Math.max(0, Math.min(parseInt(pageParam), paragraphs.length - 1));
      const target = paragraphs[idx];
      if (target) {
        const y = window.scrollY + target.getBoundingClientRect().top - 80; // невеликий відступ зверху
        window.scrollTo({ top: y, behavior: 'smooth' });
        if (idx > 0) setShowGoToStart(true);
      }
    }

    const getCurrentParagraphIndex = () => {
      // Якщо користувач практично внизу сторінки — вважаємо, що він на останньому абзаці
      const doc = document.documentElement;
      const distanceToBottom = doc.scrollHeight - (window.scrollY + window.innerHeight);
      if (distanceToBottom <= 20 && paragraphs.length > 0) {
        return paragraphs.length - 1;
      }
      const viewportTop = 0;
      const viewportBottom = window.innerHeight;
      let bestIdx = 0;
      let bestScore = Infinity;
      paragraphs.forEach((p, i) => {
        const rect = p.getBoundingClientRect();
        // Центр абзацу відносно в'юпорта
        const center = rect.top + rect.height / 2;
        const score = Math.abs(center - viewportTop - 100); // тяжіємо до верхньої частини екрана
        if (center >= viewportTop && center <= viewportBottom) {
          if (score < bestScore) {
            bestScore = score;
            bestIdx = i;
          }
        }
      });
      return bestIdx;
    };

    const scheduleSave = (index: number) => {
      if (index === lastSavedPageRef.current) return;
      lastSavedPageRef.current = index;
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
      // дебаунс 500мс
      saveTimerRef.current = window.setTimeout(async () => {
        try {
          // Не залежимо від стану user у сторі — пробуємо зберегти.
          // Авторизація здійснюється інтерцепторами apiClient.
          if (titleId) {
            await apiClient.post('/users/update-progress', {
              titleId: titleId,
              chapterNumber: currentChapter!.chapterNumber,
              page: index,
            });
            // Оповістимо головну сторінку, щоб вона оновила блок "Продовжити читати"
            window.dispatchEvent(new CustomEvent('reading-progress-updated'));
          }
        } catch (err) {
          console.error('Помилка при збереженні прогресу:', err);
        }
      }, 500);
    };

    const onScroll = () => {
      const idx = getCurrentParagraphIndex();
      scheduleSave(idx);
      // Показувати стрілку, якщо користувач не на самому верху сторінки
      if (window.scrollY > 80) {
        setShowGoToStart(true);
      } else {
        setShowGoToStart(false);
      }
    };

    // Ініціальна фіксація позиції
    scheduleSave(getCurrentParagraphIndex());
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [currentChapter, titleId, searchParams]);

  const handleGoToStart = () => {
    setShowGoToStart(false);
    // Прибрали параметр page з URL, щоб закріпити перехід до початку
    if (searchParams.get('page')) {
      const np = new URLSearchParams(searchParams);
      np.delete('page');
      setSearchParams(np, { replace: true });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 3. Оновлення тайтла сторінки в браузері
  useEffect(() => {
    if (currentChapter) {
      document.title = `${currentChapter.titleName} - Глава ${currentChapter.chapterNumber} | SekaiLib`;
    }
  }, [currentChapter]);

  const navigateToChapter = (chapterNum: number) => {
    navigate(`/titles/${titleId}/chapters/${chapterNum}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error || !currentChapter) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen">
        <div className="text-center text-red-600 mb-4 text-xl font-medium">
          {error || 'Главу не знайдено'}
        </div>
        <button 
          onClick={() => navigate(`/titles/${titleId}`)}
          className="px-6 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
        >
          Повернутися до твору
        </button>
      </div>
    );
  }

  // Функції для визначення стилів залежно від налаштувань користувача
  const getThemeClasses = () => {
    switch (settings.theme) {
      case ReaderTheme.Dark: return 'bg-gray-900 text-gray-100';
      case ReaderTheme.Sepia: return 'bg-[#f4ecd8] text-[#5b4636]';
      default: return 'bg-white text-gray-900';
    }
  };

  const getFontSizeClass = () => {
    switch (settings.fontSize) {
      case ReaderFontSize.Small: return 'text-lg'; 
      case ReaderFontSize.Large: return 'text-3xl'; 
      default: return 'text-xl'; 
    }
  };

  const getWidthClass = () => {
    switch (settings.width) {
      case ReaderWidth.Narrow: return 'max-w-2xl';
      case ReaderWidth.Wide: return 'max-w-6xl';
      default: return 'max-w-4xl';
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 font-serif ${getThemeClasses()}`}>
      <div className={`mx-auto px-4 py-8 ${getWidthClass()}`}>
        {showGoToStart && (
          <button
            onClick={handleGoToStart}
            title="До початку глави"
            aria-label="До початку глави"
            className="fixed bottom-8 right-8 z-40 w-16 h-16 rounded-full bg-orange-600 text-white shadow-lg hover:bg-orange-700 transition flex items-center justify-center ring-2 ring-white/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5" />
              <path d="M5 12l7-7 7 7" />
            </svg>
          </button>
        )}
        
        {/* Панель керування та вибору тем */}
        <div className="mb-8 flex items-center justify-between border-b pb-4 border-gray-700/20">
          <button
            onClick={() => navigate(`/titles/${titleId}`)}
            className="text-orange-600 hover:text-orange-700 font-medium transition-colors flex items-center gap-2"
          >
            <span>←</span> До змісту
          </button>

          <div className="flex gap-3">
            <select
              value={settings.theme}
              onChange={(e) => dispatch(setTheme(e.target.value as ReaderTheme))}
              className={`px-3 py-1.5 rounded border text-sm outline-none ${
                settings.theme === ReaderTheme.Dark ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'
              }`}
            >
              <option value={ReaderTheme.Light}>Світла</option>
              <option value={ReaderTheme.Dark}>Темна</option>
              <option value={ReaderTheme.Sepia}>Сепія</option>
            </select>

            <select
              value={settings.fontSize}
              onChange={(e) => dispatch(setFontSize(e.target.value as ReaderFontSize))}
              className={`px-3 py-1.5 rounded border text-sm outline-none ${
                settings.theme === ReaderTheme.Dark ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'
              }`}
            >
              <option value={ReaderFontSize.Small}>А-</option>
              <option value={ReaderFontSize.Medium}>Стандарт</option>
              <option value={ReaderFontSize.Large}>А+</option>
            </select>
          </div>
        </div>

        {/* Шапка глави */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">{currentChapter.titleName}</h1>
          <div className="h-1 w-20 bg-orange-600 mx-auto mb-4"></div>
          <h2 className="text-2xl opacity-80 font-medium italic">
            Глава {currentChapter.chapterNumber}{currentChapter.name && `: ${currentChapter.name}`}
          </h2>
        </header>

        {/* Основний текст твору */}
        <article 
            className={`chapter-content-area selection:bg-orange-200 selection:text-orange-900 leading-relaxed ${getFontSizeClass()}`}
            style={{ color: 'inherit' }} 
        >
          {renderChapterContent(currentChapter.content)}
        </article>

        {/* Коментарі до глави */}
        <section className="mt-16 border-t border-gray-700/20 pt-10">
          <h3 className="text-2xl font-semibold mb-6">Коментарі</h3>

          <div className="mb-6 flex gap-2">
            <input
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Напишіть коментар..."
              className={`flex-1 px-4 py-2 rounded-lg ${
                settings.theme === ReaderTheme.Dark
                  ? 'bg-gray-800 text-white border border-gray-600 placeholder:text-gray-400'
                  : settings.theme === ReaderTheme.Sepia
                  ? 'bg-[#f7f0db] text-[#5b4636] border border-[#dcc9a0] placeholder:text-[#8a6e4f]'
                  : 'bg-white text-gray-900 border border-gray-300 placeholder:text-gray-500'
              }`}
            />
            <button
              onClick={async () => {
                if (!currentChapter || !newCommentText.trim()) return;
                const created = await chapterCommentsApi.add(currentChapter.id, { content: newCommentText });
                setComments((prev) => {
                  if (prev.some((c) => c.id === created.id)) return prev;
                  return dedupeTree([created, ...prev]);
                });
                setNewCommentText('');
              }}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Додати
            </button>
          </div>

          <div className="space-y-6" id="chapter-root" data-chapter-id={currentChapter.id}>
            {comments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                chapterId={currentChapter.id}
                theme={settings.theme}
                onDelete={(id) => setComments(prev => dedupeTree(removeFromTree(prev, id)))}
              />
            ))}
          </div>
        </section>

        {/* Кнопки переходу між главами */}
        <nav className="mt-16 flex items-center justify-between border-t border-gray-700/20 pt-10">
          {currentChapter.previousChapterNumber ? (
            <button
              onClick={() => navigateToChapter(currentChapter.previousChapterNumber!)}
              className="px-8 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition-all shadow-md"
            >
              ← Попередня
            </button>
          ) : <div className="w-32"></div>}

          <div className="text-base font-medium opacity-60">
            Глава {currentChapter.chapterNumber}
          </div>

          {currentChapter.nextChapterNumber ? (
            <button
              onClick={() => navigateToChapter(currentChapter.nextChapterNumber!)}
              className="px-8 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-all shadow-md"
            >
              Наступна →
            </button>
          ) : <div className="w-32"></div>}
        </nav>
      </div>
    </div>
  );
};

function CommentItem({ comment, chapterId, theme, onDelete }: { comment: ReviewComment; chapterId: string; theme: ReaderTheme; onDelete: (id: string) => void }) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [localComment, setLocalComment] = useState<ReviewComment>(comment);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setLocalComment(comment), [comment]);

  // Локальна дедуплікація гілки відповідей для уникнення дублювань
  const dedupeTreeLocal = (items: ReviewComment[] = []): ReviewComment[] => {
    const seen = new Set<string>();
    const walk = (arr: ReviewComment[]): ReviewComment[] => {
      const out: ReviewComment[] = [];
      for (const c of arr) {
        if (seen.has(c.id)) continue;
        seen.add(c.id);
        const replies = c.replies ? walk(c.replies) : [];
        out.push({ ...c, replies });
      }
      return out;
    };
    return walk(items);
  };

  const getTextClasses = (t: ReaderTheme) => {
    switch (t) {
      case ReaderTheme.Dark:
        return {
          name: 'text-gray-100',
          time: 'text-gray-400',
          content: 'text-gray-200',
          border: 'border-gray-700',
        };
      case ReaderTheme.Sepia:
        return {
          name: 'text-[#5b4636]',
          time: 'text-[#8a6e4f]',
          content: 'text-[#5b4636]',
          border: 'border-[#dcc9a0]',
        };
      default:
        return {
          name: 'text-gray-900',
          time: 'text-gray-500',
          content: 'text-gray-800',
          border: 'border-gray-300',
        };
    }
  };
  const txt = getTextClasses(theme);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const isOwner = user?.id === localComment.userId;

  const getMenuThemeClasses = (t: ReaderTheme) => {
    switch (t) {
      case ReaderTheme.Dark:
        return {
          container: 'bg-gray-900 text-white border border-gray-700',
          hover: 'hover:bg-gray-800',
        };
      case ReaderTheme.Sepia:
        return {
          container: 'bg-[#f4ecd8] text-[#5b4636] border border-[#dcc9a0]',
          hover: 'hover:bg-[#eadfbe]',
        };
      default:
        return {
          container: 'bg-white text-gray-900 border border-gray-300',
          hover: 'hover:bg-gray-100',
        };
    }
  };
  const menuTheme = getMenuThemeClasses(theme);

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

  const handleLikeDislike = async (type: ReactionType) => {
    // Якщо користувач клікає на вже активну реакцію — знімаємо її
    if (localComment.userReaction === type) {
      await chapterCommentsApi.removeReaction(chapterId, localComment.id);
      const cleanedReplies = localComment.replies ? dedupeTreeLocal(localComment.replies) : [];
      setLocalComment((prev) => ({
        ...prev,
        userReaction: undefined,
        likesCount: type === ReactionType.Like ? Math.max(0, prev.likesCount - 1) : prev.likesCount,
        dislikesCount: type === ReactionType.Dislike ? Math.max(0, prev.dislikesCount - 1) : prev.dislikesCount,
        replies: cleanedReplies,
      }));
      return;
    }

    // Інакше встановлюємо нову реакцію (або перемикаємо з протилежної)
    const updated = await chapterCommentsApi.setReaction(chapterId, localComment.id, { type });
    const cleanedReplies = localComment.replies ? dedupeTreeLocal(localComment.replies) : [];
    setLocalComment({ ...updated, replies: cleanedReplies });
  };

  const submitReply = async () => {
    if (!replyText.trim()) return;
    const created = await chapterCommentsApi.add(chapterId, { content: replyText, parentCommentId: localComment.id });
    setLocalComment((curr) => {
      const exists = (curr.replies || []).some((r) => r.id === created.id);
      const nextReplies = exists ? (curr.replies || []) : [...(curr.replies || []), created];
      return { ...curr, replies: dedupeTreeLocal(nextReplies) };
    });
    setReplyText('');
    setShowReply(false);
  };

  const submitEdit = async () => {
    const text = editText.trim();
    if (!text) return;
    const updated = await chapterCommentsApi.update(chapterId, localComment.id, { content: text });
    const cleanedReplies = localComment.replies ? dedupeTreeLocal(localComment.replies) : [];
    setLocalComment({ ...updated, replies: cleanedReplies });
    setIsEditing(false);
  };

  return (
    <div className="bg-surface-800 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-surface-600 flex items-center justify-center overflow-hidden">
          {localComment.avatarUrl ? (
            <img
              src={localComment.avatarUrl}
              alt={localComment.username}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <span className={`text-sm font-medium ${txt.name}`}>
              {localComment.username?.[0]?.toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${txt.name}`}>{localComment.username}</span>
            <span className={`text-xs ${txt.time}`}>{formatRelativeTime(localComment.createdAt)}</span>
          </div>
          {!isEditing ? (
            <p className={`whitespace-pre-line mt-1 ${txt.content}`}>{localComment.content}</p>
          ) : (
            <div className="mt-2">
              <textarea
                className={`w-full resize-y rounded p-2 ${
                  theme === ReaderTheme.Dark
                    ? 'bg-gray-800 text-white border border-gray-600'
                    : theme === ReaderTheme.Sepia
                    ? 'bg-[#f7f0db] text-[#5b4636] border border-[#dcc9a0]'
                    : 'bg-white text-gray-900 border border-gray-300'
                }`}
                rows={3}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
              />
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={submitEdit}>Зберегти</Button>
                <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setEditText(localComment.content); }}>Скасувати</Button>
              </div>
            </div>
          )}
          <div className="mt-2 flex items-center gap-2">
            <IconButton
              variant="like"
              active={localComment.userReaction === ReactionType.Like}
              count={localComment.likesCount}
              onClick={() => handleLikeDislike(ReactionType.Like)}
              icon={<svg className="w-4 h-4" fill={localComment.userReaction === ReactionType.Like ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>}
            />
            <IconButton
              variant="dislike"
              active={localComment.userReaction === ReactionType.Dislike}
              count={localComment.dislikesCount}
              onClick={() => handleLikeDislike(ReactionType.Dislike)}
              icon={<svg className="w-4 h-4" fill={localComment.userReaction === ReactionType.Dislike ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg>}
            />
          </div>
          <div className="mt-2 flex items-center gap-3">
            <Button size="sm" variant="primary" className="rounded-full" onClick={() => setShowReply(s => !s)}>Відповісти</Button>
            <Button size="sm" variant="primary" className="rounded-full" disabled>Скарга</Button>
            {isOwner && (
              <div className="relative ml-1" ref={menuContainerRef}>
                <button
                  aria-label="Опції"
                  className="px-1 py-0.5 rounded hover:bg-surface-700 text-text-muted"
                  onClick={() => setMenuOpen(v => !v)}
                >
                  ...
                </button>
                {menuOpen && (
                  <div className={`absolute left-full ml-2 mt-2 w-44 rounded-md shadow-2xl z-50 ${menuTheme.container}`}>
                    <button
                      className={`w-full text-left px-3 py-2 flex items-center gap-2 ${menuTheme.hover}`}
                      onClick={() => { setIsEditing(true); setEditText(localComment.content); setMenuOpen(false); }}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
                      <span>Редагувати</span>
                    </button>
                    <button
                      className={`w-full text-left px-3 py-2 flex items-center gap-2 text-red-500 ${menuTheme.hover}`}
                      onClick={async () => {
                        if (!isAuthenticated) return;
                        await chapterCommentsApi.delete(chapterId, localComment.id);
                        setMenuOpen(false);
                        onDelete(localComment.id);
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
          {showReply && (
            <div className="mt-3 flex gap-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className={`flex-1 px-3 py-2 rounded ${
                  theme === ReaderTheme.Dark
                    ? 'bg-gray-800 text-white border border-gray-600 placeholder:text-gray-400'
                    : theme === ReaderTheme.Sepia
                    ? 'bg-[#f7f0db] text-[#5b4636] border border-[#dcc9a0] placeholder:text-[#8a6e4f]'
                    : 'bg-white text-gray-900 border border-gray-300 placeholder:text-gray-500'
                }`}
                placeholder="Напишіть відповідь..."
              />
              <Button size="sm" onClick={submitReply}>Надіслати</Button>
            </div>
          )}
          {localComment.replies && localComment.replies.length > 0 && (
            <div className={`mt-4 pl-6 relative space-y-4`}>
              <div className="absolute left-0 top-1 bottom-1 w-[2px] rounded-full bg-gradient-to-b from-white/70 via-white/40 to-white/10 pointer-events-none"></div>
              {localComment.replies.map((r) => (
                <CommentItem key={r.id} comment={r} chapterId={chapterId} theme={theme} onDelete={onDelete} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}