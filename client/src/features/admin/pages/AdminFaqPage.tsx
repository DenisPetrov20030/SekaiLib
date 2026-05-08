import { useState, useEffect } from 'react';
import { faqApi } from '../../../core/api/faq';
import type { FaqItem } from '../../../core/types/entities';

interface FaqForm {
  question: string;
  answer: string;
  order: number;
  isPublished: boolean;
}

const emptyForm: FaqForm = { question: '', answer: '', order: 0, isPublished: true };

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
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item: FaqItem) => {
    setEditingId(item.id);
    setForm({ question: item.question, answer: item.answer, order: item.order, isPublished: item.isPublished });
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

  const FormPanel = () => (
    <form onSubmit={handleSave} className="bg-surface-800 rounded-lg p-6 mb-6 space-y-4">
      <h2 className="text-lg font-semibold text-text-primary">
        {editingId ? 'Редагувати питання' : 'Нове питання'}
      </h2>
      <div>
        <label className="block text-sm text-text-muted mb-1">Питання</label>
        <input
          type="text"
          value={form.question}
          onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
          className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary-500"
          required
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
            className="w-4 h-4 accent-primary-500"
          />
          <label htmlFor="faqPublished" className="text-text-primary text-sm">Опублікувати</label>
        </div>
      </div>
      <div className="flex gap-3">
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
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-text-primary">FAQ</h1>
        {!showCreate && !editingId && (
          <button
            onClick={() => { setShowCreate(true); setForm(emptyForm); }}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            + Нове питання
          </button>
        )}
      </div>

      {(showCreate || editingId) && <FormPanel />}

      <div className="bg-surface-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-text-muted text-center py-8">Питань немає</p>
        ) : (
          <div className="divide-y divide-surface-700">
            {items.map((item) => (
              <div key={item.id} className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-text-muted bg-surface-700 px-2 py-0.5 rounded">
                      #{item.order}
                    </span>
                    {!item.isPublished && (
                      <span className="text-xs bg-surface-700 text-text-muted px-2 py-0.5 rounded">Чернетка</span>
                    )}
                  </div>
                  <p className="font-medium text-text-primary">{item.question}</p>
                  <p className="text-sm text-text-muted mt-1 line-clamp-2">{item.answer}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(item)}
                    className="px-3 py-1.5 bg-surface-700 hover:bg-surface-600 text-text-primary rounded-lg text-sm transition-colors"
                  >
                    Редагувати
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-sm transition-colors"
                  >
                    Видалити
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
