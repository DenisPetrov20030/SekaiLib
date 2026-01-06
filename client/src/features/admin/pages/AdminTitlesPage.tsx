import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { axiosInstance } from '../../../core/api';
import { Button } from '../../../shared/components';
import { ROUTES } from '../../../core/constants';
import type { Title } from '../../../core/types';

interface PagedResponse {
  data: Title[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function AdminTitlesPage() {
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTitles();
  }, []);

  const loadTitles = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get<PagedResponse>('/titles', {
        params: { page: 1, pageSize: 100 },
      });
      setTitles(response.data.data);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this title?')) return;

    try {
      await axiosInstance.delete(`/admin/titles/${id}`);
      setTitles(titles.filter((t) => t.id !== id));
    } catch {
      alert('Failed to delete title');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Manage Titles</h1>
        <Link to={ROUTES.ADMIN_TITLE_CREATE}>
          <Button>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Title
          </Button>
        </Link>
      </div>

      <div className="bg-surface-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Author</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-700">
            {titles.map((title) => (
              <tr key={title.id} className="hover:bg-surface-700/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {title.coverImageUrl && (
                      <img
                        src={title.coverImageUrl}
                        alt={title.name}
                        className="w-10 h-14 object-cover rounded"
                      />
                    )}
                    <span className="font-medium text-text-primary">{title.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-text-secondary">{title.author}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-surface-600 text-text-secondary rounded text-sm">
                    {title.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link to={`/admin/titles/${title.id}`}>
                      <Button size="sm" variant="secondary">Edit</Button>
                    </Link>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(title.id)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {titles.length === 0 && (
          <div className="text-center py-8 text-text-muted">No titles found</div>
        )}
      </div>
    </div>
  );
}
