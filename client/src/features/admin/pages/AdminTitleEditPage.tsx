import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { axiosInstance } from '../../../core/api';
import { Button, Input, Textarea, Select } from '../../../shared/components';
import { TitleStatus } from '../../../core/types/enums';
import { ROUTES } from '../../../core/constants';
import type { Genre } from '../../../core/types';

interface TitleFormData {
  title: string;
  originalTitle: string;
  description: string;
  coverUrl: string;
  status: TitleStatus;
  year: string;
  genreIds: string[];
}

const statusOptions = [
  { value: TitleStatus.Ongoing, label: 'Ongoing' },
  { value: TitleStatus.Completed, label: 'Completed' },
  { value: TitleStatus.Hiatus, label: 'Hiatus' },
  { value: TitleStatus.Cancelled, label: 'Cancelled' },
];

export function AdminTitleEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isCreate = id === 'create';

  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TitleFormData>({
    title: '',
    originalTitle: '',
    description: '',
    coverUrl: '',
    status: TitleStatus.Ongoing,
    year: '',
    genreIds: [],
  });

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await axiosInstance.get<Genre[]>('/genres');
        setGenres(response.data);
      } catch {
        setGenres([]);
      }
    };

    const fetchTitle = async (titleId: string) => {
      try {
        const response = await axiosInstance.get(`/titles/${titleId}`);
        const title = response.data;
        setFormData({
          title: title.name || '',
          originalTitle: '',
          description: title.description || '',
          coverUrl: title.coverImageUrl || '',
          status: title.status || TitleStatus.Ongoing,
          year: '',
          genreIds: title.genres?.map((g: Genre) => g.id) || [],
        });
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
        title: formData.title,
        originalTitle: formData.originalTitle || null,
        description: formData.description || null,
        coverUrl: formData.coverUrl || null,
        status: formData.status,
        year: formData.year ? parseInt(formData.year) : null,
        genreIds: formData.genreIds,
      };

      if (isCreate) {
        await axiosInstance.post('/admin/titles', payload);
      } else {
        await axiosInstance.put(`/admin/titles/${id}`, payload);
      }
      navigate(ROUTES.ADMIN_TITLES);
    } catch {
      alert('Failed to save title');
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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-text-primary mb-8">
        {isCreate ? 'Create Title' : 'Edit Title'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />

        <Input
          label="Original Title"
          value={formData.originalTitle}
          onChange={(e) => setFormData({ ...formData, originalTitle: e.target.value })}
        />

        <Textarea
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={5}
        />

        <Input
          label="Cover URL"
          value={formData.coverUrl}
          onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
          type="url"
        />

        <Select
          label="Status"
          value={formData.status}
          onChange={(v) => setFormData({ ...formData, status: v as TitleStatus })}
          options={statusOptions}
        />

        <Input
          label="Year"
          value={formData.year}
          onChange={(e) => setFormData({ ...formData, year: e.target.value })}
          type="number"
          min="1900"
          max={new Date().getFullYear() + 1}
        />

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Genres</label>
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
            {isCreate ? 'Create' : 'Save'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(ROUTES.ADMIN_TITLES)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
