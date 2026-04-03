import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamsApi } from '../../../core/api/teams';
import { Button } from '../../../shared/components';

export const CreateTeamPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const team = await teamsApi.create({
        name: name.trim(),
        description: description.trim(),
        avatarUrl: avatarUrl.trim() || null,
      });
      navigate(`/teams/${team.id}`);
    } catch {
      setError('Помилка при створенні команди');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Створити команду</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Назва команди *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Опис
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            URL аватара команди
          </label>
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading || !name.trim()}>
            {loading ? 'Створення...' : 'Створити'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/teams')}>
            Скасувати
          </Button>
        </div>
      </form>
    </div>
  );
};
