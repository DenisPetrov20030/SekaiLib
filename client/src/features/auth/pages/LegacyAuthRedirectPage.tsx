import { Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../../core/constants';

export const LegacyAuthRedirectPage = () => {
  const location = useLocation();
  const mode = location.pathname === ROUTES.REGISTER ? 'register' : 'login';
  return <Navigate to={`${ROUTES.CATALOG}?auth=${mode}`} replace />;
};
