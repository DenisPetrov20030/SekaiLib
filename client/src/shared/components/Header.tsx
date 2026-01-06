import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks';
import { ROUTES } from '../../core/constants';
import { UserRole } from '../../core/types/enums';
import { LoginModal } from './LoginModal';

export const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const isAdmin = user?.role === UserRole.Administrator || user?.role === UserRole.Moderator;

  return (
    <>
      <header className="bg-surface shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to={ROUTES.CATALOG} className="text-2xl font-bold text-primary-500">
                SekaiLib
              </Link>
              <nav className="flex space-x-4">
                <Link
                  to={ROUTES.CATALOG}
                  className="text-text-secondary hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Каталог
                </Link>
                {isAuthenticated && (
                  <>
                    <Link
                      to={ROUTES.TITLE_CREATE}
                      className="text-text-secondary hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Опублікувати
                    </Link>
                    <Link
                      to={ROUTES.READING_LISTS}
                      className="text-text-secondary hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Мої списки
                    </Link>
                  </>
                )}
                {isAdmin && (
                  <Link
                    to={ROUTES.ADMIN}
                    className="text-primary-400 hover:text-primary-300 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Admin
                  </Link>
                )}
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to={ROUTES.PROFILE}
                    className="text-text-secondary hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    {user?.username}
                  </Link>
                  <button
                    onClick={logout}
                    className="text-text-secondary hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Вийти
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="text-text-secondary hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Вхід
                  </button>
                  <Link
                    to={ROUTES.REGISTER}
                    className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
                  >
                    Реєстрація
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
};
