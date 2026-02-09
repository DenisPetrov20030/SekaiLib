import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { fetchChapterContent, setTheme, setFontSize } from '../store';
import { ReaderTheme, ReaderFontSize, ReaderWidth } from '../../../core/types';
import { renderChapterContent } from '../../../shared/utils/textRender';
import { apiClient } from '../../../core/api';

export const ReaderPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const saveTimerRef = useRef<number | null>(null);
  const lastSavedPageRef = useRef<number>(-1);
  const [showGoToStart, setShowGoToStart] = useState(false);
  const { titleId, chapterNumber } = useParams<{ titleId: string; chapterNumber: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
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