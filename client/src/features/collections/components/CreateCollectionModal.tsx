import { useState } from 'react';
import { collectionsApi } from '../../../core/api/collections';
import { Button } from '../../../shared/components';

interface Props {
  onClose: () => void;
  onCreated: (id: string) => void;
}

export const CreateCollectionModal = ({ onClose, onCreated }: Props) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Введіть назву колекції.'); return; }

    try {
      setLoading(true);
      setError(null);
      const collection = await collectionsApi.create({ title: title.trim(), description: description.trim() || undefined, isPublic });
      onCreated(collection.id);
    } catch (err: any) {
      setError(err?.message ?? 'Не вдалося створити колекцію.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-xl border border-divider bg-surface shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-divider">
          <h2 className="text-lg font-semibold text-text-primary">Нова колекція</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Назва *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              className="w-full rounded-md border border-divider bg-background px-4 py-2.5 text-text-primary outline-none focus:border-primary-500 transition-colors"
              placeholder="Назва колекції..."
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Опис</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={3}
              className="w-full rounded-md border border-divider bg-background px-4 py-2.5 text-text-primary outline-none focus:border-primary-500 transition-colors resize-none"
              placeholder="Необов'язково..."
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 rounded border-divider bg-background"
            />
            <span className="text-sm text-text-secondary">Публічна колекція</span>
          </label>

          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Створення...' : 'Створити'}
            </Button>
            <Button variant="secondary" type="button" onClick={onClose}>
              Скасувати
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
