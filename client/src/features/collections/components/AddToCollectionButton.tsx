import { useState, useEffect, useRef } from 'react';
import { collectionsApi } from '../../../core/api/collections';
import type { CollectionDto } from '../../../core/api/collections';
import { useAppSelector } from '../../../app/store/hooks';

interface Props {
  titleId: string;
  onLoginRequired?: () => void;
}

export const AddToCollectionButton = ({ titleId, onLoginRequired }: Props) => {
  const currentUser = useAppSelector((s) => s.auth.user);
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState<CollectionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleOpen = async () => {
    if (!currentUser) { onLoginRequired?.(); return; }
    if (open) { setOpen(false); return; }

    try {
      setLoading(true);
      setError(null);
      const data = await collectionsApi.getByUser(currentUser.id, titleId);
      setCollections(data);
      setAdded(new Set(data.filter((c) => c.containsTitle).map((c) => c.id)));
      setOpen(true);
    } catch {
      setError('Не вдалося завантажити колекції.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (collectionId: string) => {
    if (added.has(collectionId)) return;
    try {
      setAdding(collectionId);
      setError(null);
      await collectionsApi.addItem(collectionId, { titleId });
      setAdded((prev) => new Set([...prev, collectionId]));
      setCollections((prev) => prev.map((collection) => (
        collection.id === collectionId
          ? { ...collection, titleCount: (collection.titleCount ?? 0) + 1, containsTitle: true }
          : collection
      )));
    } catch (err: any) {
      const errors = err?.errors as Record<string, string[]> | undefined;
      const titleErrors = errors?.TitleId ?? errors?.titleId;
      const duplicateError = Array.isArray(titleErrors)
        ? titleErrors.find((message) => typeof message === 'string' && message.toLowerCase().includes('вже є в колекції'))
        : undefined;

      if (duplicateError) {
        setAdded((prev) => new Set([...prev, collectionId]));
        setError(null);
      } else {
        const firstValidationError = errors
          ? Object.values(errors).flat().find((message) => typeof message === 'string' && message.trim().length > 0)
          : null;
        setError(firstValidationError ?? err?.message ?? 'Помилка додавання.');
      }
    } finally {
      setAdding(null);
    }
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={handleOpen}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-md border border-divider bg-surface text-sm text-text-secondary hover:text-text-primary hover:border-white/20 transition-all"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        {loading ? 'Завантаження...' : 'До колекції'}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-30 w-64 rounded-xl border border-divider bg-surface shadow-2xl py-2">
          <p className="px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
            Мої колекції
          </p>

          {error && (
            <p className="px-4 py-2 text-xs text-red-400">{error}</p>
          )}

          {collections.length === 0 ? (
            <p className="px-4 py-3 text-sm text-text-muted">Немає колекцій. Створіть першу!</p>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              {collections.map((col) => {
                const isAdded = added.has(col.id);
                const isAdding = adding === col.id;
                return (
                  <button
                    key={col.id}
                    onClick={() => handleAdd(col.id)}
                    disabled={isAdded || isAdding}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                      isAdded
                        ? 'text-emerald-400 cursor-default'
                        : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                    }`}
                  >
                    <span className="flex-1 truncate">{col.title}</span>
                    <span className="flex-shrink-0 text-xs text-text-muted">{col.titleCount}</span>
                    {isAdded && <span className="flex-shrink-0">✓</span>}
                    {isAdding && <span className="flex-shrink-0 animate-spin">⟳</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
