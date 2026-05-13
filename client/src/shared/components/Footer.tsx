import { Link } from 'react-router-dom';
import { ROUTES } from '../../core/constants';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { label: 'Про нас', path: ROUTES.ABOUT },
    { label: 'Контакти', path: ROUTES.CONTACT },
    { label: 'Умови використання', path: ROUTES.TERMS },
    { label: 'Політика конфіденційності', path: ROUTES.PRIVACY },
  ];

  return (
    <footer className="border-t border-white/10 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <div className="flex flex-col">
            <Link to={ROUTES.HOME} className="text-2xl font-bold text-primary-500 w-fit">
              SekaiLib
            </Link>
            <p className="text-text-secondary text-sm mt-2">
              Платформа для читання та обговорення манги та ранобе
            </p>
          </div>

          {/* Links Section */}
          <div className="flex flex-col">
            <h3 className="text-text-primary font-semibold mb-4">Посилання</h3>
            <nav className="flex flex-col items-start space-y-2">
              {footerLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-text-secondary hover:text-primary-400 transition-colors text-sm"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Info Section */}
          <div className="flex flex-col">
            <h3 className="text-text-primary font-semibold mb-4">Інформація</h3>
            <div className="space-y-2 text-sm text-text-secondary">
              <p>Email: support@sekailib.com</p>
              <p>© {currentYear} SekaiLib. Всі права захищені.</p>
            </div>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-text-secondary text-xs">
          <p className="mt-4 md:mt-0">
            SekaiLib © {currentYear}
          </p>
        </div>
      </div>
    </footer>
  );
};
