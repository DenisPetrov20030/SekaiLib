import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chaptersApi } from '../../../core/api';
import { Button, Input, Textarea } from '../../../shared/components';
import type { CreateChapterRequest, UpdateChapterRequest } from '../../../core/types/dtos';

interface ChapterFormData {
  chapterNumber: number;
  name: string;
  content: string;
  isPremium: boolean;
}

export const ChapterEditorPage = () => {
  const { titleId, chapterId } = useParams<{ titleId: string; chapterId?: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ChapterFormData>({
    chapterNumber: 1,
    name: '',
    content: '',
    isPremium: false,
  });

  const isEditMode = !!chapterId;

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
        chapterNumber: chapter.number,
        name: chapter.name,
        content: chapter.content,
        isPremium: false,
      });
    } catch (error) {
      console.error('Failed to load chapter:', error);
      alert('Помилка завантаження глави');
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
        };
        await chaptersApi.update(chapterId, request);
      } else if (titleId) {
        const request: CreateChapterRequest = {
          chapterNumber: formData.chapterNumber,
          name: formData.name,
          content: formData.content,
          isPremium: formData.isPremium,
        };
        await chaptersApi.create(titleId, request);
      }
      navigate(`/titles/${titleId}`);
    } catch (error) {
      console.error('Failed to save chapter:', error);
      alert('Помилка при збереженні глави');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!chapterId || !confirm('Ви впевнені, що хочете видалити цю главу?')) return;

    try {
      setLoading(true);
      await chaptersApi.delete(chapterId);
      navigate(`/titles/${titleId}`);
    } catch (error) {
      console.error('Failed to delete chapter:', error);
      alert('Помилка при видаленні глави');
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
        {isEditMode ? 'Редагувати главу' : 'Додати главу'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Номер глави"
            type="number"
            value={formData.chapterNumber}
            onChange={(e) => setFormData({ ...formData, chapterNumber: Number(e.target.value) })}
            required
            min={1}
          />

          <Input
            label="Назва глави"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Глава 1: Початок"
          />
        </div>

        <Textarea
          label="Контент"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          required
          rows={20}
          placeholder="Текст глави..."
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
            Преміум глава
          </label>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Збереження...' : isEditMode ? 'Зберегти зміни' : 'Створити главу'}
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
