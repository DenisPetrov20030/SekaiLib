import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { teamsApi } from '../../../core/api/teams';
import type { TranslationTeamDto } from '../../../core/types/dtos';
import { useAppSelector } from '../../../app/store/hooks';
import { Button } from '../../../shared/components';

const DEFAULT_TEAM_AVATAR = '/team-default-avatar.svg';

export const TeamsPage = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [teams, setTeams] = useState<TranslationTeamDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teamsApi.getAll()
      .then(setTeams)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Команди перекладачів</h1>
        {user && (
          <Button onClick={() => navigate('/teams/create')} size="sm">
            Створити команду
          </Button>
        )}
      </div>

      {teams.length === 0 ? (
        <p className="text-text-muted text-center py-16">Команд поки немає</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {teams.map((team) => (
            <Link
              key={team.id}
              to={`/teams/${team.id}`}
              className="flex items-center gap-4 p-4 bg-surface rounded-lg shadow hover:bg-surface-hover transition-colors"
            >
              <img
                src={team.avatarUrl || DEFAULT_TEAM_AVATAR}
                alt={team.name}
                className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                onError={(e) => {
                  if (e.currentTarget.src.endsWith(DEFAULT_TEAM_AVATAR)) return;
                  e.currentTarget.src = DEFAULT_TEAM_AVATAR;
                }}
              />
              <div className="min-w-0">
                <h2 className="font-semibold text-text-primary truncate">{team.name}</h2>
                <p className="text-sm text-text-muted truncate">{team.description}</p>
                <div className="mt-1 flex gap-3 text-xs text-text-muted">
                  <span className="flex items-center gap-1" title="Глави">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    {team.chapterCount}
                  </span>
                  <span className="flex items-center gap-1" title="Твори">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
                    {team.titleCount ?? 0}
                  </span>
                  <span className="flex items-center gap-1" title="Підписники">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    {team.subscriberCount}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
