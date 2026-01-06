import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { login, register, logout } from '../store/authSlice';
import type { LoginRequest, RegisterRequest } from '../../../core/types';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, loading, error } = useAppSelector((state) => state.auth);

  const handleLogin = async (credentials: LoginRequest) => {
    return dispatch(login(credentials)).unwrap();
  };

  const handleRegister = async (userData: RegisterRequest) => {
    return dispatch(register(userData)).unwrap();
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
    logout: handleLogout,
  };
};
