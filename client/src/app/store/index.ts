import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/store/authSlice';
import catalogReducer from '../../features/catalog/store/catalogSlice';
import titleReducer from '../../features/title/store/titleSlice';
import readerReducer from '../../features/reader/store/readerSlice';
import readingListsReducer from '../../features/reading-lists/store/readingListsSlice';
import profileReducer from '../../features/profile/store/profileSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    catalog: catalogReducer,
    title: titleReducer,
    reader: readerReducer,
    readingLists: readingListsReducer,
    profile: profileReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
