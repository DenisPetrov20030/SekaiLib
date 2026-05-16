import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { titlesApi, genresApi } from '../../../core/api';
import { Button, Input, Textarea } from '../../../shared/components';
import { TitleStatus } from '../../../core/types/enums';
import type { CreateTitleRequest } from '../../../core/types';
import type { Genre } from '../../../core/api/genres';

type CoverTab = 'upload' | 'url';

export const CreateTitlePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [formData, setFormData] = useState<CreateTitleRequest>({
    name: '',
    author: '',
    description: '',
    coverImageUrl: '',
    status: TitleStatus.Ongoing,
    countryOfOrigin: '',
    genreIds: [] as string[],
  });

  const [coverTab, setCoverTab] = useState<CoverTab>('upload');
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    try {
      const data = await genresApi.getAll();
      setGenres(data);
    } catch (error) {
      console.error('Failed to load genres:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const title = await titlesApi.create(formData);
      navigate(`/titles/${title.id}`);
    } catch (error) {
      console.error('Failed to create title:', error);
      alert('Помилка при створенні твору');
    } finally {
      setLoading(false);
    }
  };

  const handleGenreToggle = (genreId: string) => {
    setFormData((prev) => ({
      ...prev,
      genreIds: prev.genreIds.includes(genreId)
        ? prev.genreIds.filter((id) => id !== genreId)
        : [...prev.genreIds, genreId],
    }));
  };

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverUploading(true);
    try {
      const url = await titlesApi.uploadCover(file);
      setFormData((prev) => ({ ...prev, coverImageUrl: url }));
      setCoverPreview(url);
    } catch (error) {
      console.error('Failed to upload cover:', error);
      alert('Помилка при завантаженні обкладинки');
    } finally {
      setCoverUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-text-primary mb-8">Опублікувати твір</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Назва"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="Введіть назву твору"
        />

        <Input
          label="Автор"
          value={formData.author}
          onChange={(e) => setFormData({ ...formData, author: e.target.value })}
          required
          placeholder="Введіть ім'я автора"
        />

        <Textarea
          label="Опис"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          rows={6}
          placeholder="Опишіть сюжет твору"
        />

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Обкладинка
          </label>

          {coverPreview && (
            <div className="mb-3">
              <img
                src={coverPreview}
                alt="Попередній перегляд обкладинки"
                className="h-24 w-16 object-cover rounded-md border border-surface-hover"
              />
            </div>
          )}

          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setCoverTab('upload')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                coverTab === 'upload'
                  ? 'bg-primary-500 text-white'
                  : 'bg-surface text-text-secondary hover:bg-surface-hover'
              }`}
            >
              Завантажити
            </button>
            <button
              type="button"
              onClick={() => setCoverTab('url')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                coverTab === 'url'
                  ? 'bg-primary-500 text-white'
                  : 'bg-surface text-text-secondary hover:bg-surface-hover'
              }`}
            >
              URL
            </button>
          </div>

          {coverTab === 'upload' && (
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverFileChange}
                disabled={coverUploading}
                className="block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-500 file:text-white hover:file:bg-primary-600 disabled:opacity-50"
              />
              {coverUploading && (
                <p className="text-sm text-text-secondary">Завантаження...</p>
              )}
            </div>
          )}

          {coverTab === 'url' && (
            <Input
              label=""
              value={formData.coverImageUrl}
              onChange={(e) => {
                setFormData({ ...formData, coverImageUrl: e.target.value });
                setCoverPreview(e.target.value || null);
              }}
              placeholder="https://example.com/cover.jpg"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Статус
          </label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: Number(e.target.value) as TitleStatus })
            }
            className="block w-full rounded-md border-surface-hover bg-surface text-text-primary shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2"
          >
            <option value={TitleStatus.Ongoing}>Продовжується</option>
            <option value={TitleStatus.Completed}>Завершено</option>
            <option value={TitleStatus.Hiatus}>Перерва</option>
            <option value={TitleStatus.Cancelled}>Скасовано</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Країна походження *
          </label>
          <select
            value={formData.countryOfOrigin}
            onChange={(e) => setFormData({ ...formData, countryOfOrigin: e.target.value })}
            required
            className="block w-full rounded-md border-surface-hover bg-surface text-text-primary shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2"
          >
            <option value="">Виберіть країну</option>
            <option value="Japan">Японія</option>
            <option value="China">Китай</option>
            <option value="Korea">Південна Корея</option>
            <option value="Other">Інше</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Жанри
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {genres.map((genre) => (
              <label
                key={genre.id}
                className="flex items-center space-x-2 p-3 rounded-lg border border-surface-hover hover:bg-surface-hover cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={formData.genreIds.includes(genre.id)}
                  onChange={() => handleGenreToggle(genre.id)}
                  className="rounded text-primary-500 focus:ring-primary-500"
                />
                <span className="text-text-primary">{genre.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" loading={loading} disabled={!formData.name || !formData.author}>
            Опублікувати
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            Скасувати
          </Button>
        </div>
      </form>
    </div>
  );
};
