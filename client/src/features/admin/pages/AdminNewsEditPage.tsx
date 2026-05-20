import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { newsApi } from '../../../core/api/news';
import { ROUTES } from '../../../core/constants';
import { useDialog } from '../../../shared/hooks/useDialog';

export function AdminNewsEditPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { alert } = useDialog();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit || !id) return;
    newsApi.getById(id)
      .then((res) => {
        setTitle(res.data.title);
        setContent(res.data.content);
        setIsPublished(res.data.isPublished);
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      if (isEdit && id) {
        await newsApi.update(id, { title, content, isPublished });
      } else {
        await newsApi.create({ title, content, isPublished });
      }
      navigate(ROUTES.ADMIN_NEWS);
    } catch {
      await alert({ title: 'Помилка', message: 'Не вдалося зберегти' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-text-primary mb-8">
        {isEdit ? 'Редагувати новину' : 'Нова новина'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-surface-800 rounded-lg p-6">
        <div>
          <label className="block text-sm text-text-muted mb-1">Заголовок</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-text-muted mb-1">Вміст</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary-500 resize-y"
            required
          />
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isPublished"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="w-4 h-4 accent-primary-500"
          />
          <label htmlFor="isPublished" className="text-text-primary">Опублікувати</label>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {submitting ? 'Збереження...' : 'Зберегти'}
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.ADMIN_NEWS)}
            className="px-6 py-2 bg-surface-700 hover:bg-surface-600 text-text-primary rounded-lg font-medium transition-colors"
          >
            Скасувати
          </button>
        </div>
      </form>
    </div>
  );
}
