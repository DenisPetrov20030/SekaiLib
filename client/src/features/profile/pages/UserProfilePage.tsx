import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usersApi } from '../../../core/api';
import { TitleCard } from '../../catalog/components/TitleCard';
import { Pagination } from '../../catalog/components/Pagination';
import type { UserProfile } from '../../../core/api/users';
import type { TitleDto, PagedResponse } from '../../../core/types';

export const UserProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [titles, setTitles] = useState<PagedResponse<TitleDto> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadProfile();
      loadTitles(1);
    }
  }, [userId]);

  const loadProfile = async () => {
    try {
      const data = await usersApi.getProfile(userId!);
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const loadTitles = async (pageNum: number) => {
    try {
      setLoading(true);
      const data = await usersApi.getUserTitles(userId!, pageNum, 20);
      setTitles(data);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load titles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
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
      <div className="bg-surface rounded-lg p-6 mb-8">
        <div className="flex items-center gap-6">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.username}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-surface-hover flex items-center justify-center">
              <span className="text-4xl text-text-muted">
                {profile.username.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-text-primary">{profile.username}</h1>
            <p className="text-text-secondary mt-1">{profile.email}</p>
            <p className="text-text-muted text-sm mt-2">
              На сайті з {new Date(profile.createdAt).toLocaleDateString('uk-UA')}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-primary">
          Опубліковані твори ({titles?.totalCount || 0})
        </h2>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-text-muted">Завантаження...</p>
        </div>
      ) : titles && titles.data.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
            {titles.data.map((title) => (
              <TitleCard key={title.id} title={title} />
            ))}
          </div>

          {titles.totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={titles.totalPages}
              onPageChange={loadTitles}
            />
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-text-muted">Користувач ще не опублікував жодного твору</p>
        </div>
      )}
    </div>
  );
};
