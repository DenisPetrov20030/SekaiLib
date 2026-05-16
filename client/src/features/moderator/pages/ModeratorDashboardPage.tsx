import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { moderationApi, type ModerationStatsDto } from '../../../core/api/moderation';
import { ROUTES } from '../../../core/constants';

interface StatCard {
  label: string;
  value: number;
  to: string;
  color: string;
  icon: string;
}

export function ModeratorDashboardPage() {
  const [stats, setStats] = useState<ModerationStatsDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    moderationApi.getStats()
      .then((r) => setStats(r.data))
      .finally(() => setLoading(false));
  }, []);

  const cards: StatCard[] = [
    {
      label: 'Очікують перевірки',
      value: stats?.pendingQueueCount ?? 0,
      to: ROUTES.MODERATOR_QUEUE,
      color: 'bg-yellow-500/20 text-yellow-400',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    },
    {
      label: 'Відкриті скарги',
      value: stats?.pendingReportCount ?? 0,
      to: ROUTES.MODERATOR_REPORTS,
      color: 'bg-red-500/20 text-red-400',
      icon: 'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9',
    },
    {
      label: 'Активні бани',
      value: stats?.activeBanCount ?? 0,
      to: ROUTES.MODERATOR_USERS,
      color: 'bg-orange-500/20 text-orange-400',
      icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
    },
    {
      label: 'Попереджень сьогодні',
      value: stats?.totalWarningsToday ?? 0,
      to: ROUTES.MODERATOR_LOGS,
      color: 'bg-blue-500/20 text-blue-400',
      icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Панель модератора</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="bg-surface-800 rounded-lg p-5 hover:bg-surface-700 transition-colors flex items-center gap-4"
          >
            <div className={`rounded-lg p-3 ${card.color}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{card.value}</p>
              <p className="text-sm text-text-secondary">{card.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-surface-800 rounded-lg p-5">
        <h2 className="text-lg font-semibold text-text-primary mb-3">Швидкі дії</h2>
        <div className="flex flex-wrap gap-3">
          <Link to={ROUTES.MODERATOR_QUEUE} className="btn-primary text-sm px-4 py-2 rounded-lg">
            Переглянути чергу
          </Link>
          <Link to={ROUTES.MODERATOR_BAD_WORDS} className="bg-surface-700 hover:bg-surface-600 text-text-primary text-sm px-4 py-2 rounded-lg transition-colors">
            Стоп-слова
          </Link>
          <Link to={ROUTES.MODERATOR_LOGS} className="bg-surface-700 hover:bg-surface-600 text-text-primary text-sm px-4 py-2 rounded-lg transition-colors">
            Журнал дій
          </Link>
        </div>
      </div>
    </div>
  );
}
