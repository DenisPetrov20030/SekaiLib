import { useCatalog } from '../hooks';
import { TitleGrid, CatalogFilters, SearchBar, Pagination } from '../components';

export const CatalogPage = () => {
  const {
    titles,
    genres,
    filters,
    page,
    totalPages,
    totalCount,
    loading,
    search,
    filterByGenre,
    filterByCountry,
    filterByStatus,
    clearFilters,
    changePage,
  } = useCatalog();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Каталог</h1>
        <p className="mt-2 text-text-secondary">
          {totalCount} {totalCount === 1 ? 'твір' : 'творів'} знайдено
        </p>
      </div>

      <SearchBar onSearch={search} initialValue={filters.search} />

      <CatalogFilters
        genres={genres}
        selectedGenre={filters.genreId}
        selectedCountry={filters.country}
        selectedStatus={filters.status}
        onGenreChange={filterByGenre}
        onCountryChange={filterByCountry}
        onStatusChange={filterByStatus}
        onClear={clearFilters}
      />

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          <TitleGrid titles={titles} />

          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={changePage}
            />
          )}
        </>
      )}
    </div>
  );
};
