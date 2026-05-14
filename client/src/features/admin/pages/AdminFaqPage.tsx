import { useState, useEffect } from 'react';
import { faqApi } from '../../../core/api/faq';
import type { FaqItem } from '../../../core/types/entities';
import { FAQ_CATEGORIES } from '../../faq/pages/FaqPage';

interface FaqForm {
  question: string;
  answer: string;
  order: number;
  isPublished: boolean;
  categoryId: string;
}

const emptyForm: FaqForm = { 
  question: '', 
  answer: '', 
  order: 0, 
  isPublished: true, 
  categoryId: 'general' 
};

export function AdminFaqPage() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FaqForm>(emptyForm);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await faqApi.getAll();
      setItems(res.data);
    } catch (error) {
      console.error('Помилка завантаження FAQ:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item: FaqItem) => {
    setEditingId(item.id);
    setForm({ 
      question: item.question, 
      answer: item.answer, 
      order: item.order, 
      isPublished: item.isPublished,
      categoryId: item.categoryId || 'general'
    });
    setShowCreate(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowCreate(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        const res = await faqApi.update(editingId, form);
        setItems((prev) => prev.map((i) => (i.id === editingId ? res.data : i)));
      } else {
        const res = await faqApi.create(form);
        setItems((prev) => [...prev, res.data].sort((a, b) => a.order - b.order));
      }
      cancelEdit();
    } catch {
      alert('Помилка при збереженні');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Видалити питання?')) return;
    try {
      await faqApi.delete(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      alert('Помилка при видаленні');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Адміністрування FAQ</h1>
        {!showCreate && !editingId && (
          <button
            onClick={() => { setShowCreate(true); setForm(emptyForm); }}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            + Нове питання
          </button>
        )}
      </div>

      {/* Форма створення/редагування винесена сюди для збереження фокусу */}
      {(showCreate || editingId) && (
        <form onSubmit={handleSave} className="bg-surface-800 rounded-lg p-6 mb-6 space-y-4 border border-surface-700 shadow-xl">
          <h2 className="text-lg font-semibold text-text-primary">
            {editingId ? 'Редагувати питання' : 'Нове питання'}
          </h2>
          
          <div>
            <label className="block text-sm text-text-muted mb-1">Категорія (Блок)</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary-500"
              required
            >
              {FAQ_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-text-muted mb-1">Питання</label>
            <input
              type="text"
              value={form.question}
              onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
              className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary-500"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-text-muted mb-1">Відповідь</label>
            <textarea
              value={form.answer}
              onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
              rows={4}
              className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary-500 resize-y"
              required
            />
          </div>

          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm text-text-muted mb-1">Порядок</label>
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
                className="w-24 bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary-500"
              />
            </div>
            <div className="flex items-center gap-2 mt-5">
              <input
                type="checkbox"
                id="faqPublished"
                checked={form.isPublished}
                onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                className="w-4 h-4 accent-primary-500 rounded cursor-pointer"
              />
              <label htmlFor="faqPublished" className="text-text-primary text-sm cursor-pointer select-none">Опублікувати</label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {submitting ? 'Збереження...' : 'Зберегти'}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="px-5 py-2 bg-surface-700 hover:bg-surface-600 text-text-primary rounded-lg text-sm transition-colors"
            >
              Скасувати
            </button>
          </div>
        </form>
      )}

      {/* Таблиця/Список питань */}
      <div className="bg-surface-800 rounded-lg overflow-hidden border border-surface-700">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-text-muted text-center py-8">Питань поки немає</p>
        ) : (
          <div className="divide-y divide-surface-700">
            {items.map((item) => (
              <div key={item.id} className="p-4 flex items-start justify-between gap-4 hover:bg-surface-700/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-text-muted bg-surface-700 px-1.5 py-0.5 rounded">
                      #{item.order}
                    </span>
                    <span className="text-xs font-medium text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded border border-primary-500/20">
                      {FAQ_CATEGORIES.find(c => c.id === item.categoryId)?.title || 'Загальне'}
                    </span>
                    {!item.isPublished && (
                      <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/20">Чернетка</span>
                    )}
                  </div>
                  <p className="font-semibold text-text-primary leading-tight">{item.question}</p>
                  <p className="text-sm text-text-muted mt-1.5 line-clamp-2">{item.answer}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(item)}
                    className="p-2 bg-surface-700 hover:bg-surface-600 text-text-primary rounded-lg transition-colors"
                    title="Редагувати"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-lg transition-colors"
                    title="Видалити"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}