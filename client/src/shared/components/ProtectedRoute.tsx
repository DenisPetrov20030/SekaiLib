import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks';
import { ROUTES } from '../../core/constants';

export const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Outlet />;
  }

  return <Navigate to={`${ROUTES.CATALOG}?auth=login`} replace />;
};
