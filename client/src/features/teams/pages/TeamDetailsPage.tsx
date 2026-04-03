import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { teamsApi } from '../../../core/api/teams';
import type { TranslationTeamDto, TeamMemberDto, TeamChapterDto } from '../../../core/types/dtos';
import { TeamMemberRole } from '../../../core/types/dtos';
import { useAppSelector } from '../../../app/store/hooks';
import { Button } from '../../../shared/components';

type Tab = 'updates' | 'members';

const ROLE_LABELS: Record<number, string> = {
  [TeamMemberRole.Owner]: 'Власник',
  [TeamMemberRole.Admin]: 'Адміністратор',
  [TeamMemberRole.Member]: 'Учасник',
};

export const TeamDetailsPage = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const [team, setTeam] = useState<TranslationTeamDto | null>(null);
  const [members, setMembers] = useState<TeamMemberDto[]>([]);
  const [chapters, setChapters] = useState<TeamChapterDto[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [subscribed, setSubscribed] = useState(false);
  const [tab, setTab] = useState<Tab>('updates');
  const [loading, setLoading] = useState(true);
  const [chaptersLoading, setChaptersLoading] = useState(false);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');

  // Add member state
  const [addUsername, setAddUsername] = useState('');
  const [addUserId, setAddUserId] = useState('');
  const [addRole, setAddRole] = useState<TeamMemberRole>(TeamMemberRole.Member);

  const currentMember = members.find((m) => m.userId === user?.id);
  const isOwner = currentMember?.role === TeamMemberRole.Owner;
  const isAdmin = currentMember?.role === TeamMemberRole.Admin;
  const canManage = isOwner || isAdmin;

  const loadChapters = useCallback(async (p: number) => {
    if (!teamId) return;
    setChaptersLoading(true);
    try {
      const res = await teamsApi.getChapters(teamId, p);
      setChapters(res.data);
      setTotalPages(res.totalPages);
    } finally {
      setChaptersLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    if (!teamId) return;
    Promise.all([
      teamsApi.getById(teamId),
      teamsApi.getMembers(teamId),
      teamsApi.getChapters(teamId, 1),
      user ? teamsApi.isSubscribed(teamId) : Promise.resolve(false),
    ]).then(([teamData, membersData, chaptersData, isSubbed]) => {
      setTeam(teamData);
      setMembers(membersData);
      setChapters(chaptersData.data);
      setTotalPages(chaptersData.totalPages);
      setSubscribed(isSubbed as boolean);
    }).finally(() => setLoading(false));
  }, [teamId, user]);

  const handleSubscribe = async () => {
    if (!teamId) return;
    if (subscribed) {
      await teamsApi.unsubscribe(teamId);
      setSubscribed(false);
      setTeam((t) => t ? { ...t, subscriberCount: t.subscriberCount - 1 } : t);
    } else {
      await teamsApi.subscribe(teamId);
      setSubscribed(true);
      setTeam((t) => t ? { ...t, subscriberCount: t.subscriberCount + 1 } : t);
    }
  };

  const handleEditSave = async () => {
    if (!teamId) return;
    const updated = await teamsApi.update(teamId, {
      name: editName,
      description: editDescription,
      avatarUrl: editAvatarUrl || null,
    });
    setTeam(updated);
    setEditing(false);
  };

  const startEdit = () => {
    if (!team) return;
    setEditName(team.name);
    setEditDescription(team.description);
    setEditAvatarUrl(team.avatarUrl ?? '');
    setEditing(true);
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!teamId) return;
    await teamsApi.removeMember(teamId, targetUserId);
    setMembers((prev) => prev.filter((m) => m.userId !== targetUserId));
    setTeam((t) => t ? { ...t, memberCount: t.memberCount - 1 } : t);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId || !addUserId.trim()) return;
    try {
      const newMember = await teamsApi.addMember(teamId, { userId: addUserId.trim(), role: addRole });
      setMembers((prev) => [...prev, newMember]);
      setTeam((t) => t ? { ...t, memberCount: t.memberCount + 1 } : t);
      setAddUserId('');
      setAddUsername('');
    } catch {
      alert('Не вдалося додати учасника');
    }
  };

  const handleChangePage = (p: number) => {
    setPage(p);
    loadChapters(p);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!team) {
    return <div className="text-center py-16 text-text-muted">Команду не знайдено</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      {editing ? (
        <div className="bg-surface rounded-lg p-6 mb-6 space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">Редагування команди</h2>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Назва</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Опис</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">URL аватара</label>
            <input
              type="url"
              value={editAvatarUrl}
              onChange={(e) => setEditAvatarUrl(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleEditSave}>Зберегти</Button>
            <Button variant="secondary" onClick={() => setEditing(false)}>Скасувати</Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-6 mb-6">
          {team.avatarUrl ? (
            <img
              src={team.avatarUrl}
              alt={team.name}
              className="w-20 h-20 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary-900 flex items-center justify-center flex-shrink-0">
              <span className="text-primary-300 text-3xl font-bold">
                {team.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-text-primary">{team.name}</h1>
              {canManage && (
                <Button size="sm" variant="secondary" onClick={startEdit}>
                  Редагувати
                </Button>
              )}
              {user && !isOwner && (
                <Button
                  size="sm"
                  variant={subscribed ? 'secondary' : 'primary'}
                  onClick={handleSubscribe}
                >
                  {subscribed ? 'Відписатись' : 'Підписатись'}
                </Button>
              )}
            </div>
            <p className="mt-1 text-text-secondary text-sm">
              Власник:{' '}
              <Link
                to={`/users/${team.ownerId}`}
                className="text-primary-400 hover:text-primary-300"
              >
                {team.ownerUsername}
              </Link>
            </p>
            {team.description && (
              <p className="mt-2 text-text-muted text-sm whitespace-pre-line">{team.description}</p>
            )}
            <div className="mt-3 flex gap-5 text-sm text-text-muted">
              <span title={`Глави: ${team.chapterCount}`} className="cursor-default">
                📖 <span className="text-text-secondary font-medium">{team.chapterCount}</span>
              </span>
              <span title={`Учасники: ${team.memberCount}`} className="cursor-default">
                👥 <span className="text-text-secondary font-medium">{team.memberCount}</span>
              </span>
              <span title={`Підписники: ${team.subscriberCount}`} className="cursor-default">
                🔔 <span className="text-text-secondary font-medium">{team.subscriberCount}</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        {(['updates', 'members'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-primary-500 text-primary-400'
                : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            {t === 'updates' ? 'Оновлення' : 'Учасники'}
          </button>
        ))}
      </div>

      {/* Updates tab */}
      {tab === 'updates' && (
        <div>
          {chaptersLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : chapters.length === 0 ? (
            <p className="text-text-muted text-center py-8">Глав ще немає</p>
          ) : (
            <div className="space-y-2">
              {chapters.map((ch) => (
                <Link
                  key={ch.id}
                  to={`/titles/${ch.translationTeamId ? '' : ''}${ch.id}`}
                  className="block p-4 bg-surface rounded-lg hover:bg-surface-hover transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-text-primary">Глава {ch.chapterNumber}</span>
                      {ch.name && (
                        <span className="ml-2 text-text-muted text-sm">— {ch.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-muted">
                      {ch.isPremium && (
                        <span className="text-yellow-500 font-medium">Premium</span>
                      )}
                      <span>{new Date(ch.publishedAt).toLocaleDateString('uk-UA')}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => handleChangePage(p)}
                  className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                    p === page
                      ? 'bg-primary-600 text-white'
                      : 'bg-surface text-text-secondary hover:bg-surface-hover'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Members tab */}
      {tab === 'members' && (
        <div>
          <div className="space-y-2 mb-6">
            {members.map((m) => (
              <div
                key={m.userId}
                className="flex items-center justify-between p-3 bg-surface rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {m.avatarUrl ? (
                    <img src={m.avatarUrl} alt={m.username} className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-surface-hover flex items-center justify-center text-text-muted font-medium">
                      {m.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <Link
                      to={`/users/${m.userId}`}
                      className="text-text-primary font-medium hover:text-primary-400 transition-colors"
                    >
                      {m.username}
                    </Link>
                    <p className="text-xs text-text-muted">{ROLE_LABELS[m.role]}</p>
                  </div>
                </div>
                {canManage && m.role !== TeamMemberRole.Owner && m.userId !== user?.id && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleRemoveMember(m.userId)}
                  >
                    Видалити
                  </Button>
                )}
                {m.userId === user?.id && m.role !== TeamMemberRole.Owner && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleRemoveMember(m.userId)}
                  >
                    Покинути
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Add member (owner/admin only) */}
          {canManage && (
            <form onSubmit={handleAddMember} className="bg-surface rounded-lg p-4">
              <h3 className="text-sm font-semibold text-text-secondary mb-3">Додати учасника</h3>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder="ID користувача"
                  value={addUserId}
                  onChange={(e) => setAddUserId(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-1.5 text-sm bg-background border border-border rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <select
                  value={addRole}
                  onChange={(e) => setAddRole(Number(e.target.value) as TeamMemberRole)}
                  className="px-3 py-1.5 text-sm bg-background border border-border rounded-md text-text-primary focus:outline-none"
                >
                  {isOwner && (
                    <option value={TeamMemberRole.Admin}>Адміністратор</option>
                  )}
                  <option value={TeamMemberRole.Member}>Учасник</option>
                </select>
                <Button type="submit" size="sm" disabled={!addUserId.trim()}>
                  Додати
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
