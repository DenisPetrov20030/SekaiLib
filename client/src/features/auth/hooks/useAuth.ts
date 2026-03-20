import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { login, register, logout, completeOAuth } from '../store/authSlice';
import { authApi } from '../api';
import type { LoginRequest, RegisterRequest, AuthProvider } from '../../../core/types';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, loading, error } = useAppSelector((state) => state.auth);

  const handleLogin = async (credentials: LoginRequest) => {
    return dispatch(login(credentials)).unwrap();
  };

  const handleRegister = async (userData: RegisterRequest) => {
    return dispatch(register(userData)).unwrap();
  };

  const handleCompleteOAuth = async (ticket: string) => {
    return dispatch(completeOAuth(ticket)).unwrap();
  };

  const handleStartOAuth = (provider: AuthProvider, returnUrl?: string) => {
    authApi.startOAuth(provider, returnUrl);
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login: handleLogin,
    register: handleRegister,
    completeOAuth: handleCompleteOAuth,
    startOAuth: handleStartOAuth,
    logout: handleLogout,
  };
};
