import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { ReaderTheme, ReaderFontSize, ReaderWidth } from '../../../core/types';
import type { ChapterContent } from '../../../core/types';
import { readerApi } from '../api';
import { storage } from '../../../core/utils';
import { READER_SETTINGS_STORAGE_KEY } from '../../../core/constants';

interface ReaderSettings {
  theme: ReaderTheme;
  fontSize: ReaderFontSize;
  width: ReaderWidth;
}

interface ReaderState {
  currentChapter: ChapterContent | null;
  settings: ReaderSettings;
  progress: number;
  loading: boolean;
  error: string | null;
}

const defaultSettings: ReaderSettings = {
  theme: ReaderTheme.Light,
  fontSize: ReaderFontSize.Medium,
  width: ReaderWidth.Medium,
};

const loadSettings = (): ReaderSettings => {
  const saved = storage.get<ReaderSettings>(READER_SETTINGS_STORAGE_KEY);
  return saved || defaultSettings;
};

const initialState: ReaderState = {
  currentChapter: null,
  settings: loadSettings(),
  progress: 0,
  loading: false,
  error: null,
};

export const fetchChapterContent = createAsyncThunk(
  'reader/fetchChapterContent',
  async ({ titleId, chapterNumber }: { titleId: string; chapterNumber: number }, { rejectWithValue }) => {
    try {
      const content = await readerApi.getChapterContent(titleId, chapterNumber);
      return content;
    } catch (error) {
      return rejectWithValue((error as { message: string }).message);
    }
  }
);

const readerSlice = createSlice({
  name: 'reader',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ReaderTheme>) => {
      state.settings.theme = action.payload;
      storage.set(READER_SETTINGS_STORAGE_KEY, state.settings);
    },
    setFontSize: (state, action: PayloadAction<ReaderFontSize>) => {
      state.settings.fontSize = action.payload;
      storage.set(READER_SETTINGS_STORAGE_KEY, state.settings);
    },
    setWidth: (state, action: PayloadAction<ReaderWidth>) => {
      state.settings.width = action.payload;
      storage.set(READER_SETTINGS_STORAGE_KEY, state.settings);
    },
    setProgress: (state, action: PayloadAction<number>) => {
      state.progress = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChapterContent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChapterContent.fulfilled, (state, action: PayloadAction<ChapterContent>) => {
        state.loading = false;
        state.currentChapter = action.payload;
        state.progress = 0;
      })
      .addCase(fetchChapterContent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setTheme, setFontSize, setWidth, setProgress } = readerSlice.actions;
export default readerSlice.reducer;
