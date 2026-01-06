import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ReadingListItem, UpdateReadingStatusRequest } from '../../../core/types';
import { readingListsApi } from '../api';

interface ReadingListsState {
  items: ReadingListItem[];
  loading: boolean;
  error: string | null;
}

const initialState: ReadingListsState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchReadingLists = createAsyncThunk(
  'readingLists/fetchReadingLists',
  async (_, { rejectWithValue }) => {
    try {
      const lists = await readingListsApi.getReadingLists();
      return lists;
    } catch (error) {
      return rejectWithValue((error as { message: string }).message);
    }
  }
);

export const addToReadingList = createAsyncThunk(
  'readingLists/addToReadingList',
  async (data: UpdateReadingStatusRequest, { rejectWithValue }) => {
    try {
      await readingListsApi.addToList(data);
      return data;
    } catch (error) {
      return rejectWithValue((error as { message: string }).message);
    }
  }
);

export const removeFromReadingList = createAsyncThunk(
  'readingLists/removeFromReadingList',
  async (titleId: string, { rejectWithValue }) => {
    try {
      await readingListsApi.removeFromList(titleId);
      return titleId;
    } catch (error) {
      return rejectWithValue((error as { message: string }).message);
    }
  }
);

const readingListsSlice = createSlice({
  name: 'readingLists',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReadingLists.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReadingLists.fulfilled, (state, action: PayloadAction<ReadingListItem[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchReadingLists.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(removeFromReadingList.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.titleId !== action.payload);
      });
  },
});

export default readingListsSlice.reducer;
