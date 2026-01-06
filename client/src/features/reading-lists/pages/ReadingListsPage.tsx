import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { fetchReadingLists } from '../store';
import { ReadingStatus } from '../../../core/types';

export const ReadingListsPage = () => {
  const { status } = useParams<{ status?: string }>();
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((state) => state.readingLists);

  useEffect(() => {
    dispatch(fetchReadingLists());
  }, [dispatch]);

  const selectedStatus: ReadingStatus | undefined = status !== undefined ? (Number(status) as ReadingStatus) : undefined;

  const filteredItems = selectedStatus !== undefined
    ? items.filter((item) => item.status === selectedStatus)
    : items;

  const getCountByStatus = (s: ReadingStatus) => {
    return items.filter((item) => item.status === s).length;
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
      <h1 className="text-3xl font-bold text-text-primary mb-8">My Reading Lists</h1>

      <div className="mb-6 flex gap-4 border-b border-surface-hover">
        {Object.values(ReadingStatus).map((s) => (
          <a
            key={s}
            href={`/reading-lists/${s}`}
            className={`px-4 py-2 border-b-2 ${
              selectedStatus === s || (selectedStatus === undefined && s === ReadingStatus.Reading)
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {s} ({getCountByStatus(s)})
          </a>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No titles in this list</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredItems.map((item) => (
            <a
              key={item.titleId}
              href={`/titles/${item.titleId}`}
              className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="aspect-w-2 aspect-h-3 bg-gray-200">
                {item.title.coverImageUrl ? (
                  <img
                    src={item.title.coverImageUrl}
                    alt={item.title.name}
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center bg-gray-300">
                    <span className="text-gray-500">No cover</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {item.title.name}
                </h3>
                <p className="mt-1 text-sm text-gray-600">{item.title.author}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
