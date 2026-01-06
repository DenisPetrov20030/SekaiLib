import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { TitleDetails } from '../../../core/types';
import { titleApi } from '../api';

interface TitleState {
  currentTitle: TitleDetails | null;
  loading: boolean;
  error: string | null;
}

const initialState: TitleState = {
  currentTitle: null,
  loading: false,
  error: null,
};

export const fetchTitleDetails = createAsyncThunk(
  'title/fetchTitleDetails',
  async (id: string, { rejectWithValue }) => {
    try {
      const title = await titleApi.getTitleById(id);
      return title;
    } catch (error) {
      return rejectWithValue((error as { message: string }).message);
    }
  }
);

const titleSlice = createSlice({
  name: 'title',
  initialState,
  reducers: {
    clearTitle: (state) => {
      state.currentTitle = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTitleDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTitleDetails.fulfilled, (state, action: PayloadAction<TitleDetails>) => {
        state.loading = false;
        state.currentTitle = action.payload;
      })
      .addCase(fetchTitleDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearTitle } = titleSlice.actions;
export default titleSlice.reducer;
