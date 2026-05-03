import { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { fetchReadingLists } from '../store';
import { ReadingStatus } from '../../../core/types';
import { Button, Modal } from '../../../shared/components';
import { ROUTES } from '../../../core/constants';
import { usersApi } from '../../../core/api';
import type { UserList } from '../../../core/types';
import { Link } from 'react-router-dom';

const READING_STATUS_LABELS: Record<ReadingStatus, string> = {
  [ReadingStatus.Reading]: 'Читаю',
  [ReadingStatus.Planned]: 'Заплановано',
  [ReadingStatus.Completed]: 'Завершено',
  [ReadingStatus.Dropped]: 'Припинено',
  [ReadingStatus.Favorite]: 'Улюблені',
};

const READING_STATUSES = [
  ReadingStatus.Reading,
  ReadingStatus.Planned,
  ReadingStatus.Completed,
  ReadingStatus.Dropped,
  ReadingStatus.Favorite,
] as const;

const SORT_OPTION_STORAGE_KEY = 'reading-lists-sort-option';
const SELECTED_TAB_STORAGE_KEY = 'reading-lists-selected-tab';
const VIEW_MODE_STORAGE_KEY = 'reading-lists-view-mode';

const parseStoredTab = (value: string | null): ReadingStatus | string => {
  if (value === null) {
    return ReadingStatus.Reading;
  }

  const statusValues = Object.values(ReadingStatus).filter((status) => typeof status === 'number') as ReadingStatus[];
  const numericValue = Number(value);

  if (!Number.isNaN(numericValue) && statusValues.includes(numericValue as ReadingStatus)) {
    return numericValue as ReadingStatus;
  }

  return value;
};


export const ReadingListsPage = () => {
  const [selectedTab, setSelectedTab] = useState<ReadingStatus | string>(() => {
    if (typeof window === 'undefined') return ReadingStatus.Reading;

    return parseStoredTab(window.localStorage.getItem(SELECTED_TAB_STORAGE_KEY));
  });
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((state) => state.readingLists);
  const [customLists, setCustomLists] = useState<UserList[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [tabOrder, setTabOrder] = useState<(ReadingStatus | string)[]>([
    ReadingStatus.Reading,
    ReadingStatus.Planned,
    ReadingStatus.Completed,
    ReadingStatus.Dropped,
    ReadingStatus.Favorite,
  ]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    if (typeof window === 'undefined') return 'grid';

    const savedViewMode = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return savedViewMode === 'list' || savedViewMode === 'grid' ? savedViewMode : 'grid';
  });
  const [sortOption, setSortOption] = useState<string>(() => {
    if (typeof window === 'undefined') return 'name_asc';

    const savedSortOption = window.localStorage.getItem(SORT_OPTION_STORAGE_KEY);
    return savedSortOption ?? 'name_asc';
  });

  useEffect(() => {
    dispatch(fetchReadingLists());
  }, [dispatch]);

  useEffect(() => {
    loadCustomLists();
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SELECTED_TAB_STORAGE_KEY, String(selectedTab));
  }, [selectedTab]);

  useEffect(() => {
    window.localStorage.setItem(SORT_OPTION_STORAGE_KEY, sortOption);
  }, [sortOption]);

  useEffect(() => {
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  const loadCustomLists = async () => {
    try {
      const data = await usersApi.getCustomLists();
      setCustomLists(data);
      setTabOrder((prev) => [
        ...prev.filter((id) => Object.values(ReadingStatus).includes(id as ReadingStatus)),
        ...data.map((list) => list.id),
      ]);

      const savedTab = window.localStorage.getItem(SELECTED_TAB_STORAGE_KEY);
      const validTabs = [
        ...Object.values(ReadingStatus),
        ...data.map((list) => list.id),
      ];

      const parsedTab = parseStoredTab(savedTab);

      if (savedTab && validTabs.includes(parsedTab as ReadingStatus | string)) {
        setSelectedTab(parsedTab);
      }
    } catch (error) {
      console.error('Не вдалося завантажити кастомні списки:', error);
      setCustomLists([]);
    }
  };

  const handleMoveList = (currentIndex: number, direction: 'up' | 'down') => {
    const newOrder = [...tabOrder];
    if (direction === 'up' && currentIndex > 0) {
      [newOrder[currentIndex], newOrder[currentIndex - 1]] = [newOrder[currentIndex - 1], newOrder[currentIndex]];
    } else if (direction === 'down' && currentIndex < newOrder.length - 1) {
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
    }
    setTabOrder(newOrder);
  };

  const isStatusTab = (tab: ReadingStatus | string): tab is ReadingStatus => {
    return Object.values(ReadingStatus).includes(tab as ReadingStatus);
  };

  const filteredItems = isStatusTab(selectedTab)
    ? items.filter((item) => item.status === selectedTab && !item.userListId)
    : items.filter((item) => item.userListId === selectedTab);

  const sortedItems = (() => {
    const arr = [...filteredItems];
    switch (sortOption) {
      case 'name_asc':
        return arr.sort((a, b) => a.title.name.localeCompare(b.title.name));
      case 'name_desc':
        return arr.sort((a, b) => b.title.name.localeCompare(a.title.name));
      case 'date_added_desc':
        return arr.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
      case 'date_added_asc':
        return arr.sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
      default:
        return arr;
    }
  })();

  const getCountByStatus = (s: ReadingStatus) => {
    return items.filter((item) => item.status === s && !item.userListId).length;
  };

  const getCountByCustomList = (listId: string) => {
    return items.filter((item) => item.userListId === listId).length;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-text-primary">Мої списки читання</h1>
        <div className="flex gap-3">
          <Button onClick={() => setIsEditMode(true)} variant="secondary">
            Редагувати
          </Button>
          <Link to={ROUTES.PROFILE}>
            <Button variant="danger" size="md">Перейти в профіль</Button>
          </Link>
        </div>
      </div>

      <div className="mb-6 flex gap-4 border-b border-surface-hover overflow-x-auto">
        {tabOrder.map((tabId) => {
          const isStatus = Object.values(ReadingStatus).includes(tabId as ReadingStatus);
          if (isStatus) {
            const status = tabId as ReadingStatus;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedTab(status)}
                className={`px-4 py-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  selectedTab === status
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                {READING_STATUS_LABELS[status]} ({getCountByStatus(status)})
              </button>
            );
          }
          const list = customLists.find((l) => l.id === tabId);
          if (!list) return null;
          return (
            <button
              key={list.id}
              type="button"
              onClick={() => setSelectedTab(list.id)}
              className={`px-4 py-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                selectedTab === list.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              {list.name} ({getCountByCustomList(list.id)})
            </button>
          );
        })}
      </div>

      <div className="flex gap-10">
          <aside className="w-64 bg-surface rounded p-4 shrink-0">
            <h4 className="text-sm font-semibold mb-3">Вид</h4>
            <div className="flex flex-col gap-2 mb-4">
              <button
                onClick={() => setViewMode('list')}
                className={`text-left px-3 py-2 rounded ${viewMode === 'list' ? 'bg-surface-hover text-primary-600' : 'text-text-muted'}`}>
                Список
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`text-left px-3 py-2 rounded ${viewMode === 'grid' ? 'bg-surface-hover text-primary-600' : 'text-text-muted'}`}>
                Плитка
              </button>
            </div>

            <h4 className="text-sm font-semibold mb-3">Сортування</h4>
            <div className="flex flex-col gap-2 text-sm">
              {[
                { value: 'name_asc', label: 'По назві (A-Z)' },
                { value: 'name_desc', label: 'По назві (Z-A)' },
                { value: 'date_added_desc', label: 'Дата додавання (нові)' },
                { value: 'date_added_asc', label: 'Дата додавання (старі)' },
              ].map((option) => (
                <label key={option.value} className="group flex items-center gap-3 rounded px-2 py-2 cursor-pointer text-text-secondary hover:bg-surface-hover hover:text-text-primary">
                  <input
                    type="radio"
                    name="sort"
                    className="sr-only"
                    checked={sortOption === option.value}
                    onChange={() => setSortOption(option.value)}
                  />
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${
                      sortOption === option.value ? 'border-primary-600 bg-primary-600' : 'border-divider bg-transparent group-hover:border-primary-500'
                    }`}
                  >
                    {sortOption === option.value && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </aside>

          <main className="flex-1 pl-6">
            {sortedItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-text-muted">У цьому списку немає творів</p>
              </div>
            ) : (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {sortedItems.map((item) => (
                    <a
                      key={item.titleId}
                      href={`/titles/${item.titleId}`}
                      className="block bg-surface rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                    >
                      <div className="aspect-w-2 aspect-h-3 bg-surface-hover">
                        {item.title.coverImageUrl ? (
                          <img
                            src={item.title.coverImageUrl}
                            alt={item.title.name}
                            className="w-full h-64 object-cover"
                          />
                        ) : (
                          <div className="w-full h-64 flex items-center justify-center bg-surface-hover">
                            <span className="text-text-muted">Без обкладинки</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-text-primary line-clamp-2">{item.title.name}</h3>
                        <p className="mt-1 text-sm text-text-secondary">{item.title.author}</p>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedItems.map((item) => (
                    <a key={item.titleId} href={`/titles/${item.titleId}`} className="flex items-center gap-4 bg-surface p-3 rounded shadow-sm hover:shadow-md transition-shadow">
                      <div className="h-24 w-16 flex-shrink-0 overflow-hidden rounded bg-surface-hover">
                        {item.title.coverImageUrl ? (
                          <img
                            src={item.title.coverImageUrl}
                            alt={item.title.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-text-muted">
                            Без обкладинки
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-text-primary line-clamp-2">{item.title.name}</h3>
                        <p className="text-sm text-text-secondary">{item.title.author}</p>
                        <div className="text-xs text-text-muted mt-1">Додано: {new Date(item.addedAt).toLocaleDateString()}</div>
                      </div>
                    </a>
                  ))}
                </div>
              )
            )}
          </main>
        </div>

      <Modal isOpen={isEditMode} onClose={() => setIsEditMode(false)} title="Редактирование списков">
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {READING_STATUSES.map((status, index) => (
            <div key={status} className="flex items-center gap-3 p-3 bg-surface-hover rounded border border-divider">
              <div className="flex-1 min-w-0">
                <p className="text-text-primary font-medium truncate">{READING_STATUS_LABELS[status]}</p>
              </div>
              <div className="flex gap-2">
                {index > 0 && (
                  <button
                    onClick={() => handleMoveList(index, 'up')}
                    className="p-1 text-text-muted hover:text-text-primary hover:bg-surface-600 rounded"
                    title="Вверх"
                  >
                    ↑
                  </button>
                )}
                {index < READING_STATUSES.length - 1 && (
                  <button
                    onClick={() => handleMoveList(index, 'down')}
                    className="p-1 text-text-muted hover:text-text-primary hover:bg-surface-600 rounded"
                    title="Вниз"
                  >
                    ↓
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};
