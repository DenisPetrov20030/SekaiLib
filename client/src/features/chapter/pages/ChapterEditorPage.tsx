import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chaptersApi } from '../../../core/api';
import { teamsApi } from '../../../core/api/teams';
import { Button, Input, Textarea } from '../../../shared/components';
import { useAppSelector } from '../../../app/store/hooks';
import { useDialog } from '../../../shared/hooks/useDialog';
import type { CreateChapterRequest, UpdateChapterRequest, TranslationTeamDto } from '../../../core/types/dtos';

interface ChapterFormData {
  chapterNumber: number;
  name: string;
  content: string;
  isPremium: boolean;
  price: number;
  translationTeamId: string;
  earlyAccessUntil: string;
}

export const ChapterEditorPage = () => {
  const { titleId, chapterId } = useParams<{ titleId: string; chapterId?: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [myTeams, setMyTeams] = useState<TranslationTeamDto[]>([]);
  const [formData, setFormData] = useState<ChapterFormData>({
    chapterNumber: 1,
    name: '',
    content: '',
    isPremium: false,
    price: 0,
    translationTeamId: '',
    earlyAccessUntil: '',
  });

  const { confirm, alert } = useDialog();
  const isEditMode = !!chapterId;

  useEffect(() => {
    if (!isEditMode && user) {
      teamsApi.getMyTeams(true).then(setMyTeams).catch(() => {});
    }
  }, [isEditMode, user]);

  useEffect(() => {
    if (isEditMode && chapterId) {
      loadChapter(chapterId);
    }
  }, [chapterId, isEditMode]);

  const loadChapter = async (id: string) => {
    try {
      setLoading(true);
      const chapter = await chaptersApi.getById(id);
      setFormData({
        chapterNumber: chapter.number ?? 1,
        name: chapter.name ?? '',
        content: chapter.content ?? '',
        isPremium: chapter.isPremium ?? false,
        price: chapter.price ?? 0,
        translationTeamId: '',
        earlyAccessUntil: chapter.earlyAccessUntil
          ? new Date(chapter.earlyAccessUntil).toISOString().slice(0, 16)
          : '',
      });
    } catch (error) {
      console.error('Failed to load chapter:', error);
      await alert({ title: 'Помилка', message: 'Не вдалося завантажити розділ' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditMode && chapterId) {
        const request: UpdateChapterRequest = {
          chapterNumber: formData.chapterNumber,
          name: formData.name,
          content: formData.content,
          isPremium: formData.isPremium,
          price: formData.isPremium ? formData.price : 0,
        };
        await chaptersApi.update(chapterId, request);
      } else if (titleId) {
        const request: CreateChapterRequest = {
          chapterNumber: formData.chapterNumber,
          name: formData.name,
          content: formData.content,
          isPremium: formData.isPremium,
          price: formData.isPremium ? formData.price : 0,
          translationTeamId: formData.translationTeamId || null,
          earlyAccessUntil: formData.isPremium && formData.earlyAccessUntil
            ? new Date(formData.earlyAccessUntil).toISOString()
            : null,
        };
        await chaptersApi.create(titleId, request);
      }
      navigate(`/titles/${titleId}`);
    } catch (error) {
      console.error('Failed to save chapter:', error);
      await alert({ title: 'Помилка', message: 'Не вдалося зберегти розділ' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!chapterId) return;
    const ok = await confirm({
      title: 'Видалити розділ?',
      message: 'Цю дію не можна скасувати.',
      confirmLabel: 'Видалити',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      setLoading(true);
      await chaptersApi.delete(chapterId);
      navigate(`/titles/${titleId}`);
    } catch (error) {
      console.error('Failed to delete chapter:', error);
      await alert({ title: 'Помилка', message: 'Не вдалося видалити розділ' });
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-text-primary mb-8">
        {isEditMode ? 'Редагувати розділ' : 'Додати розділ'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Номер розділу"
            type="number"
            value={formData.chapterNumber}
            onChange={(e) => setFormData({ ...formData, chapterNumber: Number(e.target.value) })}
            required
            min={1}
          />

          <Input
            label="Назва розділу"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Розділ 1: Початок"
          />
        </div>

        {!isEditMode && myTeams.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Команда перекладу
            </label>
            <select
              value={formData.translationTeamId}
              onChange={(e) => setFormData({ ...formData, translationTeamId: e.target.value })}
              className="w-full px-3 py-2 bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">— без команди —</option>
              {myTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <Textarea
          label="Контент"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          required
          rows={20}
          placeholder="Текст розділу..."
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPremium"
            checked={formData.isPremium}
            onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
            className="rounded text-primary-500 focus:ring-primary-500"
          />
          <label htmlFor="isPremium" className="text-sm text-text-secondary">
            Преміум розділ
          </label>
        </div>

        {formData.isPremium && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Ціна (₴) <span className="text-text-muted text-xs">0 = безкоштовно</span>
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Math.max(0, parseFloat(e.target.value) || 0) })}
                className="w-32 px-3 py-2 rounded-lg bg-surface-2 border border-border text-text-primary focus:outline-none focus:border-primary-500 text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Відкрити безкоштовно після{' '}
                <span className="text-text-muted text-xs">(залиш порожнім якщо завжди платно)</span>
              </label>
              <input
                type="datetime-local"
                value={formData.earlyAccessUntil}
                onChange={(e) => setFormData({ ...formData, earlyAccessUntil: e.target.value })}
                className="px-3 py-2 rounded-lg bg-surface-2 border border-border text-text-primary focus:outline-none focus:border-primary-500 text-sm"
              />
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Збереження...' : isEditMode ? 'Зберегти зміни' : 'Створити розділ'}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(`/titles/${titleId}`)}
          >
            Скасувати
          </Button>

          {isEditMode && (
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={loading}
            >
              Видалити
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};
