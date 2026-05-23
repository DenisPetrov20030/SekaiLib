import { NavLink, Outlet } from 'react-router-dom';
import { ROUTES } from '../../../core/constants';

const navItems = [
  {
    to: ROUTES.MODERATOR,
    end: true,
    label: 'Дашборд',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    to: ROUTES.MODERATOR_QUEUE,
    end: false,
    label: 'Черга',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  },
  {
    to: ROUTES.MODERATOR_REPORTS,
    end: false,
    label: 'Скарги',
    icon: 'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9',
  },
  {
    to: ROUTES.MODERATOR_USERS,
    end: false,
    label: 'Користувачі',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    to: ROUTES.MODERATOR_LOGS,
    end: false,
    label: 'Журнал',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    to: ROUTES.MODERATOR_BAD_WORDS,
    end: false,
    label: 'Стоп-слова',
    icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
  },
];

export function ModeratorLayout() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Mobile: horizontal scrollable tab bar */}
      <nav className="md:hidden flex gap-1 overflow-x-auto scrollbar-none bg-surface-800 rounded-lg p-2 mb-6">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                isActive
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-700'
              }`
            }
          >
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
            </svg>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-56 shrink-0">
          <div className="bg-surface-800 rounded-lg p-3 sticky top-24">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider px-3 mb-2">
              Модерація
            </p>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-700'
                    }`
                  }
                >
                  <svg
                    className="w-5 h-5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
