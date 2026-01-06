import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Title, CatalogFilters, Genre, TitleStatus } from '../../../core/types';
import { catalogApi } from '../api';
import { PAGINATION } from '../../../core/constants';

interface CatalogState {
  titles: Title[];
  genres: Genre[];
  filters: CatalogFilters;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
}

const initialState: CatalogState = {
  titles: [],
  genres: [],
  filters: {},
  page: PAGINATION.DEFAULT_PAGE,
  pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
  totalCount: 0,
  totalPages: 0,
  loading: false,
  error: null,
};

export const fetchCatalog = createAsyncThunk(
  'catalog/fetchCatalog',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { catalog: CatalogState };
      const { filters, page, pageSize } = state.catalog;
      const response = await catalogApi.getCatalog({ ...filters, page, pageSize });
      return response;
    } catch (error) {
      return rejectWithValue((error as { message: string }).message);
    }
  }
);

export const fetchGenres = createAsyncThunk(
  'catalog/fetchGenres',
  async (_, { rejectWithValue }) => {
    try {
      const genres = await catalogApi.getGenres();
      return genres;
    } catch (error) {
      return rejectWithValue((error as { message: string }).message);
    }
  }
);

const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    setSearch: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload;
      state.page = PAGINATION.DEFAULT_PAGE;
    },
    setGenreFilter: (state, action: PayloadAction<string | undefined>) => {
      state.filters.genreId = action.payload;
      state.page = PAGINATION.DEFAULT_PAGE;
    },
    setCountryFilter: (state, action: PayloadAction<string | undefined>) => {
      state.filters.country = action.payload;
      state.page = PAGINATION.DEFAULT_PAGE;
    },
    setStatusFilter: (state, action: PayloadAction<TitleStatus | undefined>) => {
      state.filters.status = action.payload;
      state.page = PAGINATION.DEFAULT_PAGE;
    },
    clearFilters: (state) => {
      state.filters = {};
      state.page = PAGINATION.DEFAULT_PAGE;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
      state.page = PAGINATION.DEFAULT_PAGE;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCatalog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCatalog.fulfilled, (state, action) => {
        state.loading = false;
        state.titles = action.payload.data || action.payload.items || [];
        state.page = action.payload.page;
        state.pageSize = action.payload.pageSize;
        state.totalCount = action.payload.totalCount;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchCatalog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchGenres.fulfilled, (state, action) => {
        state.genres = action.payload;
      });
  },
});

export const {
  setSearch,
  setGenreFilter,
  setCountryFilter,
  setStatusFilter,
  clearFilters,
  setPage,
  setPageSize,
} = catalogSlice.actions;

export default catalogSlice.reducer;
