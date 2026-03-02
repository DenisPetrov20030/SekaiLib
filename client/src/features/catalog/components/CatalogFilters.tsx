import { TitleStatus } from '../../../core/types';
import type { Genre } from '../../../core/types';

interface CatalogFiltersProps {
  genres: Genre[];
  selectedGenres: string[];
  selectedCountry?: string;
  selectedStatus?: TitleStatus;
  onGenreChange: (genreIds: string[]) => void;
  onCountryChange: (country: string | undefined) => void;
  onStatusChange: (status: TitleStatus | undefined) => void;
  onClear: () => void;
}

export const CatalogFilters = ({
  genres,
  selectedGenres,
  selectedCountry,
  selectedStatus,
  onGenreChange,
  onCountryChange,
  onStatusChange,
  onClear,
}: CatalogFiltersProps) => {
  const handleGenreSelect = (genreId: string) => {
    if (!genreId) {
      return;
    }

    if (selectedGenres.includes(genreId)) {
      onGenreChange(selectedGenres.filter((id) => id !== genreId));
      return;
    }

    onGenreChange([...selectedGenres, genreId]);
  };

  const handleCountryChange = (value: string) => {
    onCountryChange(value || undefined);
  };

  const handleStatusChange = (value: string) => {
    onStatusChange(value ? (Number(value) as TitleStatus) : undefined);
  };

  const handleClear = () => {
    onClear();
  };

  const selectedGenreNames = genres
    .filter((genre) => selectedGenres.includes(genre.id))
    .map((genre) => genre.name);

  return (
    <div className="bg-surface p-4 rounded-lg shadow-md mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Жанр
          </label>
          <select
            value=""
            onChange={(e) => handleGenreSelect(e.target.value)}
            className="block w-full rounded-md border-surface-hover bg-surface text-text-primary shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="">{selectedGenres.length > 0 ? `Обрано жанрів: ${selectedGenres.length}` : 'Усі жанри'}</option>
            {genres.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          {selectedGenreNames.length > 0 && (
            <p className="mt-1 text-xs text-text-secondary truncate" title={selectedGenreNames.join(', ')}>
              {selectedGenreNames.join(', ')}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-text-secondary mb-1">
            Країна
          </label>
          <select
            id="country"
            value={selectedCountry || ''}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="block w-full rounded-md border-surface-hover bg-surface text-text-primary shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="">Усі країни</option>
            <option value="Japan">Японія</option>
            <option value="China">Китай</option>
            <option value="Korea">Південна Корея</option>
            <option value="Other">Інше</option>
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-text-secondary mb-1">
            Статус
          </label>
          <select
            id="status"
            value={selectedStatus || ''}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="block w-full rounded-md border-surface-hover bg-surface text-text-primary shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="">Усі статуси</option>
            <option value={TitleStatus.Ongoing}>Продовжується</option>
            <option value={TitleStatus.Completed}>Завершено</option>
            <option value={TitleStatus.Hiatus}>Перерва</option>
            <option value={TitleStatus.Cancelled}>Скасовано</option>
          </select>
        </div>

        <div className="flex items-start md:pt-6">
          <button
            onClick={handleClear}
            className="w-full px-4 py-2 border border-surface-hover rounded-md shadow-sm text-sm font-medium text-text-primary bg-surface hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Очистити фільтри
          </button>
        </div>
      </div>
    </div>
  );
};
