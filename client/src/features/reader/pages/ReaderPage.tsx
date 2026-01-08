import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { fetchChapterContent, setTheme, setFontSize } from '../store';
import { ReaderTheme, ReaderFontSize, ReaderWidth } from '../../../core/types';

export const ReaderPage = () => {
  const { titleId, chapterNumber } = useParams<{ titleId: string; chapterNumber: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentChapter, settings, loading, error } = useAppSelector((state) => state.reader);

  useEffect(() => {
    if (titleId && chapterNumber) {
      dispatch(fetchChapterContent({ titleId, chapterNumber: parseInt(chapterNumber) }));
    }
  }, [dispatch, titleId, chapterNumber]);

  const navigateToChapter = (chapterNum: number) => {
    navigate(`/titles/${titleId}/chapters/${chapterNum}`);
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          {error || 'Chapter not found'}
        </div>
      </div>
    );
  }

  const getThemeClasses = () => {
    switch (settings.theme) {
      case ReaderTheme.Dark:
        return 'bg-gray-900 text-white';
      case ReaderTheme.Sepia:
        return 'bg-amber-50 text-gray-900';
      default:
        return 'bg-white text-gray-900';
    }
  };

  const getFontSizeClass = () => {
    switch (settings.fontSize) {
      case ReaderFontSize.Small:
        return 'text-base';
      case ReaderFontSize.Large:
        return 'text-xl';
      default:
        return 'text-lg';
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
    <div className={`min-h-screen ${getThemeClasses()}`}>
      <div className={`mx-auto px-4 py-8 ${getWidthClass()}`}>
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate(`/titles/${titleId}`)}
            className="text-primary-600 hover:text-primary-700"
          >
            ← Повернутися до твору
          </button>

          <div className="flex gap-2">
            <select
              value={settings.theme}
              onChange={(e) => dispatch(setTheme(e.target.value as ReaderTheme))}
              className={`px-3 py-1 rounded border transition-colors ${
                settings.theme === ReaderTheme.Dark
                  ? 'bg-surface-800 text-text-primary border-surface-600 hover:bg-black'
                  : 'bg-white text-gray-900 border-gray-300'
              }`}
            >
              <option value={ReaderTheme.Light}>Світла</option>
              <option value={ReaderTheme.Dark}>Темна</option>
              <option value={ReaderTheme.Sepia}>Сепія</option>
            </select>

            <select
              value={settings.fontSize}
              onChange={(e) => dispatch(setFontSize(e.target.value as ReaderFontSize))}
              className={`px-3 py-1 rounded border transition-colors ${
                settings.theme === ReaderTheme.Dark
                  ? 'bg-surface-800 text-text-primary border-surface-600 hover:bg-black'
                  : 'bg-white text-gray-900 border-gray-300'
              }`}
            >
              <option value={ReaderFontSize.Small}>Маленький</option>
              <option value={ReaderFontSize.Medium}>Середній</option>
              <option value={ReaderFontSize.Large}>Великий</option>
            </select>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">{currentChapter.titleName}</h1>
          <h2 className="text-xl mt-2">
            {currentChapter.name && ` ${currentChapter.name}`}
          </h2>
        </div>

        <div className={`prose max-w-none ${getFontSizeClass()} ${
          settings.theme === ReaderTheme.Dark 
            ? 'prose-invert' 
            : settings.theme === ReaderTheme.Sepia 
            ? 'prose' 
            : 'prose'
        }`}>
          <div dangerouslySetInnerHTML={{ __html: currentChapter.content }} />
        </div>

        <div className="mt-12 flex items-center justify-between border-t pt-6">
          {currentChapter.previousChapterNumber ? (
            <button
              onClick={() => navigateToChapter(currentChapter.previousChapterNumber!)}
              className="px-6 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              ← Попередня глава
            </button>
          ) : (
            <div></div>
          )}

          {currentChapter.nextChapterNumber ? (
            <button
              onClick={() => navigateToChapter(currentChapter.nextChapterNumber!)}
              className="px-6 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              Наступна глава →
            </button>
          ) : (
            <div></div>
          )}
        </div>
      </div>
    </div>
  );
};
