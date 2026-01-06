import { useState, useEffect } from 'react';
import { useDebounce } from '../../../shared/hooks';

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialValue?: string;
}

export const SearchBar = ({ onSearch, initialValue = '' }: SearchBarProps) => {
  const [query, setQuery] = useState(initialValue);
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  return (
    <div className="mb-6">
      <input
        type="text"
        placeholder="Search by title or author..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-lg"
      />
    </div>
  );
};
