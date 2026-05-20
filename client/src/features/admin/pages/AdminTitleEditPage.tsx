import { useState, useEffect } from 'react';
import { useParams, useNavigate, useMatch } from 'react-router-dom';
import { axiosInstance, titlesApi } from '../../../core/api';
import { Button, Input, Textarea, Select } from '../../../shared/components';
import { TitleStatus } from '../../../core/types/enums';
import { ROUTES } from '../../../core/constants';
import { useDialog } from '../../../shared/hooks/useDialog';
import type { Genre } from '../../../core/types';

interface TitleFormData {
  name: string;
  author: string;
  description: string;
  coverImageUrl: string;
  status: TitleStatus;
  countryOfOrigin: string;
  genreIds: string[];
}

type CoverTab = 'upload' | 'url';

const statusOptions = [
  { value: String(TitleStatus.Ongoing), label: 'Випускається' },
  { value: String(TitleStatus.Completed), label: 'Завершений' },
  { value: String(TitleStatus.Hiatus), label: 'Зупинений' },
  { value: String(TitleStatus.Cancelled), label: 'Випуск припинено' },
];

const countryOptions = [
  { value: 'Japan', label: 'Японія' },
  { value: 'China', label: 'Китай' },
  { value: 'Korea', label: 'Південна Корея' },
  { value: 'Other', label: 'Інше' },
];

export function AdminTitleEditPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const matchCreate = useMatch(ROUTES.ADMIN_TITLE_CREATE);
  const isCreate = Boolean(matchCreate);

  const { alert } = useDialog();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TitleFormData>({
    name: '',
    author: '',
    description: '',
    coverImageUrl: '',
    status: TitleStatus.Ongoing,
    countryOfOrigin: 'Japan',
    genreIds: [],
  });

  const [coverTab, setCoverTab] = useState<CoverTab>('upload');
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await axiosInstance.get<Genre[]>('/admin/genres');
        setGenres(response.data);
      } catch {
        setGenres([]);
      }
    };

    const fetchTitle = async (titleId: string) => {
      try {
        const response = await axiosInstance.get(`/titles/${titleId}`);
        const title = response.data;
        const coverUrl = title.coverImageUrl || '';
        setFormData({
          name: title.name || '',
          author: title.author || '',
          description: title.description || '',
          coverImageUrl: coverUrl,
          status: title.status || TitleStatus.Ongoing,
          countryOfOrigin: title.countryOfOrigin || 'Japan',
          genreIds: title.genres?.map((g: Genre) => g.id) || [],
        });
        if (coverUrl) setCoverPreview(coverUrl);
      } catch {
        navigate(ROUTES.ADMIN_TITLES);
      }
    };

    fetchGenres();
    if (!isCreate && id) {
      fetchTitle(id);
    }
  }, [id, isCreate, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        author: formData.author,
        description: formData.description,
        coverImageUrl: formData.coverImageUrl || null,
        status: formData.status,
        countryOfOrigin: formData.countryOfOrigin,
        genreIds: formData.genreIds.map(id => id),
      };

      if (isCreate) {
        await axiosInstance.post('/admin/titles', payload);
      } else {
        await axiosInstance.put(`/admin/titles/${id}`, payload);
      }
      navigate(ROUTES.ADMIN_TITLES);
    } catch {
      await alert({ title: 'Помилка', message: 'Не вдалося зберегти твір' });
    } finally {
      setLoading(false);
    }
  };

  const toggleGenre = (genreId: string) => {
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
      await alert({ title: 'Помилка', message: 'Помилка при завантаженні обкладинки' });
    } finally {
      setCoverUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-text-primary mb-8">
        {isCreate ? 'Новий твір' : 'Редагувати твір'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Назва твору"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <Input
          label="Автор"
          value={formData.author}
          onChange={(e) => setFormData({ ...formData, author: e.target.value })}
          required
        />

        <Textarea
          label="Опис"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={5}
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
              type="url"
              placeholder="https://example.com/cover.jpg"
            />
          )}
        </div>

        <Select
          label="Країна походження"
          value={formData.countryOfOrigin}
          onChange={(v) => setFormData({ ...formData, countryOfOrigin: v })}
          options={countryOptions}
        />

        <Select
          label="Статус"
          value={String(formData.status)}
          onChange={(v) => setFormData({ ...formData, status: Number(v) as TitleStatus })}
          options={statusOptions}
        />

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Жанри</label>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => (
              <button
                key={genre.id}
                type="button"
                onClick={() => toggleGenre(genre.id)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  formData.genreIds.includes(genre.id)
                    ? 'bg-primary-500 text-white'
                    : 'bg-surface-700 text-text-secondary hover:bg-surface-600'
                }`}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" loading={loading}>
            {isCreate ? 'Новий' : 'Зберегти'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(ROUTES.ADMIN_TITLES)}>
            Скасувати
          </Button>
        </div>
      </form>
    </div>
  );
}
