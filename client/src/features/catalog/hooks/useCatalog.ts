import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { TitleStatus } from '../../../core/types';
import {
  fetchCatalog,
  fetchGenres,
  setSearch,
  setGenreFilter,
  setCountryFilter,
  setStatusFilter,
  clearFilters,
  setPage,
} from '../store';

export const useCatalog = () => {
  const dispatch = useAppDispatch();
  const {
    titles,
    genres,
    filters,
    page,
    pageSize,
    totalCount,
    totalPages,
    loading,
    error,
  } = useAppSelector((state) => state.catalog);

  useEffect(() => {
    dispatch(fetchGenres());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchCatalog());
  }, [dispatch, filters, page, pageSize]);

  const handleSearch = (query: string) => {
    dispatch(setSearch(query));
  };

  const handleGenreFilter = (genreIds: string[]) => {
    dispatch(setGenreFilter(genreIds));
  };

  const handleCountryFilter = (country: string | undefined) => {
    dispatch(setCountryFilter(country));
  };

  const handleStatusFilter = (status: TitleStatus | undefined) => {
    dispatch(setStatusFilter(status));
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
  };

  const handlePageChange = (newPage: number) => {
    dispatch(setPage(newPage));
  };

  return {
    titles,
    genres,
    filters,
    page,
    pageSize,
    totalCount,
    totalPages,
    loading,
    error,
    search: handleSearch,
    filterByGenre: handleGenreFilter,
    filterByCountry: handleCountryFilter,
    filterByStatus: handleStatusFilter,
    clearFilters: handleClearFilters,
    changePage: handlePageChange,
  };
};
