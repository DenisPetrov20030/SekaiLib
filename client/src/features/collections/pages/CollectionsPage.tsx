import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collectionsApi } from '../../../core/api/collections';
import type { CollectionDto } from '../../../core/api/collections';
import { useAppSelector } from '../../../app/store/hooks';
import { Button } from '../../../shared/components';
import { ROUTES } from '../../../core/constants';
import { CollectionCard } from '../components/CollectionCard';
import { CreateCollectionModal } from '../components/CreateCollectionModal';

export const CollectionsPage = () => {
  const navigate = useNavigate();
  const isAuth = useAppSelector((s) => !!s.auth.user);

  const [collections, setCollections] = useState<CollectionDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const pageSize = 18;

  const load = useCallback(async (searchQ: string, p: number) => {
    try {
      setLoading(true);
      const result = await collectionsApi.getAll({ search: searchQ || undefined, page: p, pageSize });
      setCollections(result.data);
      setTotalCount(result.totalCount);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(search, page);
  }, [search, page, load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Колекції</h1>
          <p className="text-text-muted mt-1 text-sm">Добірки творів від спільноти</p>
        </div>

        {isAuth && (
          <Button onClick={() => setShowCreate(true)}>+ Створити</Button>
        )}
      </div>

      {/* Search + sort */}
      <div className="flex gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Пошук колекцій..."
            className="flex-1 rounded-md border border-divider bg-surface px-4 py-2.5 text-text-primary placeholder:text-text-muted outline-none focus:border-primary-500 transition-colors"
          />
          <Button type="submit" variant="secondary">Знайти</Button>
        </form>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 rounded-xl bg-surface-hover animate-pulse" />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg className="w-14 h-14 text-text-muted/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-lg font-semibold text-text-primary">Колекцій ще немає</p>
          {search && (
            <p className="text-text-muted mt-1 text-sm">Спробуйте інший пошуковий запит</p>
          )}
          {isAuth && !search && (
            <Button className="mt-5" onClick={() => setShowCreate(true)}>
              Створити першу колекцію
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {collections.map((col) => (
              <CollectionCard key={col.id} collection={col} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ←
              </Button>
              <span className="text-sm text-text-secondary px-4">
                {page} / {totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                →
              </Button>
            </div>
          )}
        </>
      )}

      {showCreate && (
        <CreateCollectionModal
          onClose={() => setShowCreate(false)}
          onCreated={(id) => {
            setShowCreate(false);
            navigate(ROUTES.COLLECTION_DETAILS.replace(':id', id));
          }}
        />
      )}
    </div>
  );
};