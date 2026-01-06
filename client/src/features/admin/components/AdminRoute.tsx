import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../../../app/store/hooks';
import { UserRole } from '../../../core/types/enums';

export function AdminRoute() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const isAdmin = user?.role === UserRole.Administrator || user?.role === UserRole.Moderator;

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
