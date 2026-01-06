import { useState, useEffect } from 'react';
import { genresApi } from '../../../core/api';
import { Button, Input, Modal } from '../../../shared/components';
import type { Genre } from '../../../core/api/genres';

export const GenresManagementPage = () => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [genreName, setGenreName] = useState('');

  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    try {
      setLoading(true);
      const data = await genresApi.getAll();
      setGenres(data);
    } catch (error) {
      console.error('Failed to load genres:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!genreName.trim()) return;

    try {
      await genresApi.create({ name: genreName });
      setGenreName('');
      setIsModalOpen(false);
      loadGenres();
    } catch (error) {
      console.error('Failed to create genre:', error);
      alert('Помилка при створенні жанру');
    }
  };

  const handleUpdate = async () => {
    if (!editingGenre || !genreName.trim()) return;

    try {
      await genresApi.update(editingGenre.id, { name: genreName });
      setEditingGenre(null);
      setGenreName('');
      setIsModalOpen(false);
      loadGenres();
    } catch (error) {
      console.error('Failed to update genre:', error);
      alert('Помилка при оновленні жанру');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цей жанр?')) return;

    try {
      await genresApi.delete(id);
      loadGenres();
    } catch (error) {
      console.error('Failed to delete genre:', error);
      alert('Помилка при видаленні жанру');
    }
  };

  const openCreateModal = () => {
    setEditingGenre(null);
    setGenreName('');
    setIsModalOpen(true);
  };

  const openEditModal = (genre: Genre) => {
    setEditingGenre(genre);
    setGenreName(genre.name);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGenre(null);
    setGenreName('');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-text-muted">Завантаження...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Управління жанрами</h1>
        <Button onClick={openCreateModal}>Додати жанр</Button>
      </div>

      <div className="bg-surface rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-surface-hover">
          <thead className="bg-surface-hover">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Назва
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                Дії
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-hover">
            {genres.map((genre) => (
              <tr key={genre.id} className="hover:bg-surface-hover transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-text-primary">
                  {genre.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => openEditModal(genre)}
                    className="text-primary-500 hover:text-primary-400 mr-4"
                  >
                    Редагувати
                  </button>
                  <button
                    onClick={() => handleDelete(genre.id)}
                    className="text-red-500 hover:text-red-400"
                  >
                    Видалити
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {genres.length === 0 && (
          <div className="text-center py-12">
            <p className="text-text-muted">Жанрів не знайдено</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            {editingGenre ? 'Редагувати жанр' : 'Створити жанр'}
          </h2>

          <Input
            label="Назва жанру"
            value={genreName}
            onChange={(e) => setGenreName(e.target.value)}
            placeholder="Введіть назву жанру"
            autoFocus
          />

          <div className="flex gap-4 mt-6">
            <Button
              onClick={editingGenre ? handleUpdate : handleCreate}
              disabled={!genreName.trim()}
            >
              {editingGenre ? 'Зберегти' : 'Створити'}
            </Button>
            <Button variant="ghost" onClick={handleCloseModal}>
              Скасувати
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
