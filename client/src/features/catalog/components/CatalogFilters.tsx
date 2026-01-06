import { TitleStatus } from '../../../core/types';
import type { Genre } from '../../../core/types';

interface CatalogFiltersProps {
  genres: Genre[];
  selectedGenre?: string;
  selectedCountry?: string;
  selectedStatus?: TitleStatus;
  onGenreChange: (genreId: string | undefined) => void;
  onCountryChange: (country: string | undefined) => void;
  onStatusChange: (status: string | undefined) => void;
  onClear: () => void;
}

export const CatalogFilters = ({
  genres,
  selectedGenre,
  selectedCountry,
  selectedStatus,
  onGenreChange,
  onCountryChange,
  onStatusChange,
  onClear,
}: CatalogFiltersProps) => {
  const handleGenreChange = (value: string) => {
    onGenreChange(value || undefined);
  };

  const handleCountryChange = (value: string) => {
    onCountryChange(value || undefined);
  };

  const handleStatusChange = (value: string) => {
    onStatusChange(value as TitleStatus || undefined);
  };

  const handleClear = () => {
    onClear();
  };

  return (
    <div className="bg-surface p-4 rounded-lg shadow-md mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label htmlFor="genre" className="block text-sm font-medium text-text-secondary mb-1">
            Genre
          </label>
          <select
            id="genre"
            value={selectedGenre || ''}
            onChange={(e) => handleGenreChange(e.target.value)}
            className="block w-full rounded-md border-surface-hover bg-surface text-text-primary shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="">All Genres</option>
            {genres.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-text-secondary mb-1">
            Country
          </label>
          <select
            id="country"
            value={selectedCountry || ''}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="block w-full rounded-md border-surface-hover bg-surface text-text-primary shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="">All Countries</option>
            <option value="Japan">Japan</option>
            <option value="China">China</option>
            <option value="Korea">Korea</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-text-secondary mb-1">
            Status
          </label>
          <select
            id="status"
            value={selectedStatus || ''}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="block w-full rounded-md border-surface-hover bg-surface text-text-primary shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="">All Statuses</option>
            <option value={TitleStatus.Ongoing}>Ongoing</option>
            <option value={TitleStatus.Completed}>Completed</option>
            <option value={TitleStatus.Hiatus}>Hiatus</option>
            <option value={TitleStatus.Cancelled}>Cancelled</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={handleClear}
            className="w-full px-4 py-2 border border-surface-hover rounded-md shadow-sm text-sm font-medium text-text-primary bg-surface hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};
