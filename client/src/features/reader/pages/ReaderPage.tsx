import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { fetchChapterContent, setTheme, setFontSize } from '../store';
import { ReaderTheme, ReaderFontSize, ReaderWidth } from '../../../core/types';
// Імпорт вашої функції для рендерингу тексту з правильними абзацами та примітками
import { renderChapterContent } from '../../../shared/utils/textRender';

export const ReaderPage = () => {
  const { titleId, chapterNumber } = useParams<{ titleId: string; chapterNumber: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentChapter, settings, loading, error } = useAppSelector((state) => state.reader);

  // Завантаження контенту глави при зміні URL
  useEffect(() => {
    if (titleId && chapterNumber) {
      dispatch(fetchChapterContent({ titleId, chapterNumber: parseInt(chapterNumber) }));
    }
  }, [dispatch, titleId, chapterNumber]);

  // Динамічне оновлення заголовка сторінки в браузері
  useEffect(() => {
    if (currentChapter) {
      document.title = `${currentChapter.titleName} - Глава ${currentChapter.chapterNumber} | SekaiLib`;
    }
  }, [currentChapter]);

  const navigateToChapter = (chapterNum: number) => {
    navigate(`/titles/${titleId}/chapters/${chapterNum}`);
    // Плавна прокрутка вгору при зміні глави
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
          className="px-6 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
        >
          Повернутися до твору
        </button>
      </div>
    );
  }

  const getThemeClasses = () => {
    switch (settings.theme) {
      case ReaderTheme.Dark:
        return 'bg-gray-900 text-gray-100';
      case ReaderTheme.Sepia:
        return 'bg-[#f4ecd8] text-[#5b4636]';
      default:
        return 'bg-white text-gray-900';
    }
  };

  const getFontSizeClass = () => {
    switch (settings.fontSize) {
      case ReaderFontSize.Small:
        return 'text-lg'; 
      case ReaderFontSize.Large:
        return 'text-3xl'; 
      default:
        return 'text-xl'; 
    }
  };

  const getWidthClass = () => {
    switch (settings.width) {
      case ReaderWidth.Narrow:
        return 'max-w-2xl';
      case ReaderWidth.Wide:
        return 'max-w-6xl';
      default:
        return 'max-w-4xl';
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 font-serif ${getThemeClasses()}`}>
      <div className={`mx-auto px-4 py-8 ${getWidthClass()}`}>
        
        {/* Панель керування налаштуваннями */}
        <div className="mb-8 flex items-center justify-between border-b pb-4 border-gray-700/20">
          <button
            onClick={() => navigate(`/titles/${titleId}`)}
            className="text-primary-600 hover:text-primary-700 font-medium transition-colors flex items-center gap-2"
          >
            <span>←</span> До змісту
          </button>

          <div className="flex gap-3">
            <select
              value={settings.theme}
              onChange={(e) => dispatch(setTheme(e.target.value as ReaderTheme))}
              className={`px-3 py-1.5 rounded border text-sm cursor-pointer transition-colors outline-none ${
                settings.theme === ReaderTheme.Dark
                  ? 'bg-gray-800 text-white border-gray-600'
                  : 'bg-white text-gray-900 border-gray-300'
              }`}
            >
              <option value={ReaderTheme.Light}>Світла тема</option>
              <option value={ReaderTheme.Dark}>Темна тема</option>
              <option value={ReaderTheme.Sepia}>Сепія</option>
            </select>

            <select
              value={settings.fontSize}
              onChange={(e) => dispatch(setFontSize(e.target.value as ReaderFontSize))}
              className={`px-3 py-1.5 rounded border text-sm cursor-pointer transition-colors outline-none ${
                settings.theme === ReaderTheme.Dark
                  ? 'bg-gray-800 text-white border-gray-600'
                  : 'bg-white text-gray-900 border-gray-300'
              }`}
            >
              <option value={ReaderFontSize.Small}>Малий шрифт</option>
              <option value={ReaderFontSize.Medium}>Середній шрифт</option>
              <option value={ReaderFontSize.Large}>Великий шрифт</option>
            </select>
          </div>
        </div>

        {/* Заголовки глави */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">{currentChapter.titleName}</h1>
          <div className="h-1 w-20 bg-primary-600 mx-auto mb-4"></div>
          <h2 className="text-2xl opacity-80 font-medium italic">
            Глава {currentChapter.chapterNumber}{currentChapter.name && `: ${currentChapter.name}`}
          </h2>
        </header>

        {/* Контент глави з літературним форматуванням */}
        {/* Додано 'color: inherit', щоб текст забирав колір від теми з getThemeClasses */}
        <article 
            className={`chapter-content-area selection:bg-primary-200 selection:text-primary-900 ${getFontSizeClass()}`}
            style={{ color: 'inherit' }} 
        >
          {/* Виклик утиліти, яка перетворює \n у <p> та стилізує примітки */}
          {renderChapterContent(currentChapter.content)}
        </article>

        {/* Навігація між главами */}
        <nav className="mt-16 flex items-center justify-between border-t border-gray-700/20 pt-10">
          {currentChapter.previousChapterNumber ? (
            <button
              onClick={() => navigateToChapter(currentChapter.previousChapterNumber!)}
              className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-all shadow-md active:scale-95"
            >
              ← Попередня
            </button>
          ) : (
            <div className="w-32"></div>
          )}

          <div className="text-base font-medium opacity-60">
            Глава {currentChapter.chapterNumber}
          </div>

          {currentChapter.nextChapterNumber ? (
            <button
              onClick={() => navigateToChapter(currentChapter.nextChapterNumber!)}
              className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-all shadow-md active:scale-95"
            >
              Наступна →
            </button>
          ) : (
            <div className="w-32"></div>
          )}
        </nav>
      </div>
    </div>
  );
};