import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamsApi } from '../../../core/api/teams';
import { Button } from '../../../shared/components';

export const CreateTeamPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarInputMode, setAvatarInputMode] = useState<'url' | 'file'>('url');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverInputMode, setCoverInputMode] = useState<'default' | 'url' | 'file'>('default');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (avatarInputMode === 'url' && avatarUrl.trim().toLowerCase().startsWith('blob:')) {
      setError('Посилання виду blob: тимчасове і не зберігається. Оберіть файл з ПК або вставте прямий https:// URL.');
      return;
    }

    if (coverInputMode === 'url' && coverImageUrl.trim().toLowerCase().startsWith('blob:')) {
      setError('Посилання виду blob: для фону тимчасове і не зберігається. Оберіть файл з ПК або вставте прямий https:// URL.');
      return;
    }

    if (coverInputMode === 'file' && !coverImageFile) {
      setError('Оберіть файл фону перед створенням команди.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const team = await teamsApi.create({
        name: name.trim(),
        description: description.trim(),
        avatarUrl: avatarInputMode === 'url' ? (avatarUrl.trim() || null) : null,
        coverImageUrl: coverInputMode === 'url' ? (coverImageUrl.trim() || null) : null,
      });

      if (avatarInputMode === 'file' && avatarFile) {
        await teamsApi.uploadAvatar(team.id, avatarFile);
      }

      if (coverInputMode === 'file' && coverImageFile) {
        await teamsApi.uploadCover(team.id, coverImageFile);
      }

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
          <div className="mb-2 flex gap-2">
            <button
              type="button"
              onClick={() => setAvatarInputMode('url')}
              className={`px-3 py-1.5 text-sm rounded-md border ${avatarInputMode === 'url' ? 'border-primary-500 text-primary-400' : 'border-border text-text-secondary'}`}
            >
              URL
            </button>
            <button
              type="button"
              onClick={() => setAvatarInputMode('file')}
              className={`px-3 py-1.5 text-sm rounded-md border ${avatarInputMode === 'file' ? 'border-primary-500 text-primary-400' : 'border-border text-text-secondary'}`}
            >
              Файл з ПК
            </button>
          </div>

          {avatarInputMode === 'url' ? (
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          ) : (
            <div className="space-y-2">
              <input
                id="team-avatar-file-create"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <label
                htmlFor="team-avatar-file-create"
                className="inline-flex cursor-pointer items-center rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary hover:border-primary-500"
              >
                Оберіть файл
              </label>
              <p className="text-sm text-text-secondary">
                {avatarFile ? avatarFile.name : 'Файл не вибрано'}
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Фонове зображення зверху
          </label>
          <div className="mb-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCoverInputMode('default')}
              className={`px-3 py-1.5 text-sm rounded-md border ${coverInputMode === 'default' ? 'border-primary-500 text-primary-400' : 'border-border text-text-secondary'}`}
            >
              Звичайне
            </button>
            <button
              type="button"
              onClick={() => setCoverInputMode('url')}
              className={`px-3 py-1.5 text-sm rounded-md border ${coverInputMode === 'url' ? 'border-primary-500 text-primary-400' : 'border-border text-text-secondary'}`}
            >
              URL
            </button>
            <button
              type="button"
              onClick={() => setCoverInputMode('file')}
              className={`px-3 py-1.5 text-sm rounded-md border ${coverInputMode === 'file' ? 'border-primary-500 text-primary-400' : 'border-border text-text-secondary'}`}
            >
              Файл з ПК
            </button>
          </div>

          {coverInputMode === 'default' && (
            <p className="text-sm text-text-secondary">Буде використано стандартний фон команди.</p>
          )}

          {coverInputMode === 'url' ? (
            <input
              type="url"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          ) : null}

          {coverInputMode === 'file' ? (
            <div className="space-y-2">
              <input
                id="team-cover-file-create"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={(e) => setCoverImageFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <label
                htmlFor="team-cover-file-create"
                className="inline-flex cursor-pointer items-center rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary hover:border-primary-500"
              >
                Оберіть файл
              </label>
              <p className="text-sm text-text-secondary">
                {coverImageFile ? coverImageFile.name : 'Файл не вибрано'}
              </p>
            </div>
          ) : null}
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
