import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../../../core/types';
import { authApi } from '../api';
import { apiClient } from '../../../core/api';
import { storage } from '../../../core/utils';
import { TOKEN_STORAGE_KEY, ACCESS_TOKEN_STORAGE_KEY } from '../../../core/constants';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../../../core/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials);
      return response;
    } catch (error) {
      return rejectWithValue((error as { message: string }).message);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.register(userData);
      return response;
    } catch (error) {
      return rejectWithValue((error as { message: string }).message);
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authApi.getCurrentUser();
      return user;
    } catch (error) {
      return rejectWithValue((error as { message: string }).message);
    }
  }
);

export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const accessToken = storage.get<string>(ACCESS_TOKEN_STORAGE_KEY);
      const refreshToken = storage.get<string>(TOKEN_STORAGE_KEY);
      
      if (!accessToken || !refreshToken) {
        return null;
      }

      apiClient.setAccessToken(accessToken);
      const user = await authApi.getCurrentUser();
      return { user, accessToken };
    } catch (error) {
      storage.remove(ACCESS_TOKEN_STORAGE_KEY);
      storage.remove(TOKEN_STORAGE_KEY);
      apiClient.clearTokens();
      return rejectWithValue((error as { message: string }).message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.error = null;
      storage.remove(ACCESS_TOKEN_STORAGE_KEY);
      apiClient.clearTokens();
    },
    clearError: (state) => {
      state.error = null;
    },
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      storage.set(ACCESS_TOKEN_STORAGE_KEY, action.payload);
      apiClient.setAccessToken(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        storage.set(ACCESS_TOKEN_STORAGE_KEY, action.payload.accessToken);
        storage.set(TOKEN_STORAGE_KEY, action.payload.refreshToken);
        apiClient.setAccessToken(action.payload.accessToken);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        storage.set(ACCESS_TOKEN_STORAGE_KEY, action.payload.accessToken);
        storage.set(TOKEN_STORAGE_KEY, action.payload.refreshToken);
        apiClient.setAccessToken(action.payload.accessToken);
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload.user;
          state.accessToken = action.payload.accessToken;
          state.isAuthenticated = true;
        }
      });
  },
});

export const { logout, clearError, setAccessToken } = authSlice.actions;
export default authSlice.reducer;
