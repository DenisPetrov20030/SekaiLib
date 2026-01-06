import { Link } from 'react-router-dom';
import { RegisterForm } from '../components';
import { ROUTES } from '../../../core/constants';

export const RegisterPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-text-primary">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-text-secondary">
            Or{' '}
            <Link to={ROUTES.LOGIN} className="font-medium text-primary-500 hover:text-primary-400">
              sign in to existing account
            </Link>
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
};
