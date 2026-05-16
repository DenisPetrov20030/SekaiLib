import { Link } from 'react-router-dom';
import { ROUTES } from '../../../core/constants';

const cards = [
  {
    to: ROUTES.ADMIN_TITLES,
    color: 'bg-primary-500/20 text-primary-500',
    label: 'Твори',
    desc: 'Управління творами',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  },
  {
    to: ROUTES.ADMIN_GENRES,
    color: 'bg-green-500/20 text-green-500',
    label: 'Жанри',
    desc: 'Управління жанрами',
    icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
  },
  {
    to: ROUTES.ADMIN_BANS,
    color: 'bg-red-500/20 text-red-500',
    label: 'Бани',
    desc: 'Управління банами',
    icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
  },
  {
    to: ROUTES.ADMIN_REPORTS,
    color: 'bg-yellow-500/20 text-yellow-500',
    label: 'Скарги',
    desc: 'Перегляд скарг',
    icon: 'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9',
  },
  {
    to: ROUTES.ADMIN_NEWS,
    color: 'bg-blue-500/20 text-blue-500',
    label: 'Новини',
    desc: 'Публікація новин',
    icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z',
  },
  {
    to: ROUTES.ADMIN_FAQ,
    color: 'bg-purple-500/20 text-purple-500',
    label: 'FAQ',
    desc: 'Часті запитання',
    icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    to: ROUTES.ADMIN_PAYMENTS,
    color: 'bg-emerald-500/20 text-emerald-400',
    label: 'Платежі',
    desc: 'Всі транзакції',
    icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  },
];

export function AdminDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-text-primary mb-8">Панель адміна</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="bg-surface-800 rounded-lg p-6 hover:bg-surface-700 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 ${card.color.split(' ')[0]} rounded-lg`}>
                <svg className={`w-6 h-6 ${card.color.split(' ')[1]}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">{card.label}</h2>
                <p className="text-sm text-text-muted">{card.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
