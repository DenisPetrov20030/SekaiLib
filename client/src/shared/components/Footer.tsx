import { Link } from 'react-router-dom';
import { ROUTES } from '../../core/constants';

export const Footer = () => {
  return (
    <footer className="border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-lg font-bold text-primary-500">SekaiLib</span>

          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-text-muted">
            <Link to={ROUTES.CATALOG} className="hover:text-text-secondary transition-colors">Каталог</Link>
            <Link to={ROUTES.COLLECTIONS} className="hover:text-text-secondary transition-colors">Колекції</Link>
            <Link to={ROUTES.TEAMS} className="hover:text-text-secondary transition-colors">Команди</Link>
            <Link to={ROUTES.NEWS} className="hover:text-text-secondary transition-colors">Новини</Link>
            <Link to={ROUTES.FAQ} className="hover:text-text-secondary transition-colors">FAQ</Link>
          </nav>

          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} SekaiLib
          </p>
        </div>
      </div>
    </footer>
  );
};
