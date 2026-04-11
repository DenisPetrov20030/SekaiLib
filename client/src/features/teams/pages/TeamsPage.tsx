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
                  <span
                    title="Глави"
                    aria-label="Глави"
                  >
                    📖 {team.chapterCount}
                  </span>
                  <span
                    title="Твори"
                    aria-label="Твори"
                  >
                    📚 {team.titleCount ?? 0}
                  </span>
                  <span
                    title="Підписники"
                    aria-label="Підписники"
                  >
                    🔔 {team.subscriberCount}
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
