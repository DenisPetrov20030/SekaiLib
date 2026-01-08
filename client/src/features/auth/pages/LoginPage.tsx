import { Link } from 'react-router-dom';
import { LoginForm } from '../components';
import { ROUTES } from '../../../core/constants';

export const LoginPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-text-primary">
            Увійти в аккаунт
          </h2>
          <p className="mt-2 text-center text-sm text-text-secondary">
            або{' '}
            <Link to={ROUTES.REGISTER} className="font-medium text-primary-500 hover:text-primary-400">
              Створити новий аккаунт
            </Link>
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
};
