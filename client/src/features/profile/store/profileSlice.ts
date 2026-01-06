import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User, UserStatistics } from '../../../core/types';
import { profileApi } from '../api';

interface ProfileState {
  user: User | null;
  stats: UserStatistics | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  user: null,
  stats: null,
  loading: false,
  error: null,
};

export const fetchProfile = createAsyncThunk(
  'profile/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const user = await profileApi.getProfile();
      return user;
    } catch (error) {
      return rejectWithValue((error as { message: string }).message);
    }
  }
);

export const fetchStatistics = createAsyncThunk(
  'profile/fetchStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const stats = await profileApi.getStatistics();
      return stats;
    } catch (error) {
      return rejectWithValue((error as { message: string }).message);
    }
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchStatistics.fulfilled, (state, action: PayloadAction<UserStatistics>) => {
        state.stats = action.payload;
      });
  },
});

export default profileSlice.reducer;
