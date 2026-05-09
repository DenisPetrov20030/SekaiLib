import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { useAppSelector } from '../../app/store/hooks';
import { BannedAccessScreen } from './BannedAccessScreen';

export const MainLayout = () => {
  const { user, loading } = useAppSelector((state) => state.auth);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    );
  }

  if (user?.isBanned) {
    return <BannedAccessScreen user={user} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Outlet />
      </main>
    </div>
  );
};
