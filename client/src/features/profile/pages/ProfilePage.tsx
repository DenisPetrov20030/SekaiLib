import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../../app/store/hooks';
import { usersApi } from '../../../core/api';
import { TitleCard } from '../../catalog/components/TitleCard';
import { Pagination } from '../../catalog/components/Pagination';
import { Button } from '../../../shared/components';
import { formatDate } from '../../../core/utils';
import { ROUTES } from '../../../core/constants';
import type { UserProfile } from '../../../core/api/users';
import type { TitleDto } from '../../../core/types/dtos';
import type { PagedResponse } from '../../../core/types';

export const ProfilePage = () => {
  const { user: authUser } = useAppSelector((state) => state.auth);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [titles, setTitles] = useState<PagedResponse<TitleDto> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
    loadTitles(1);
  }, []);

  const loadProfile = async () => {
    try {
      const data = await usersApi.getCurrentProfile();
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const loadTitles = async (pageNum: number) => {
    if (!authUser?.id) return;
    
    try {
      setLoading(true);
      const data = await usersApi.getUserTitles(authUser.id, pageNum, 20);
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-surface rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between">
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
                На сайті з {formatDate(profile.createdAt)}
              </p>
            </div>
          </div>
          <Link to={ROUTES.TITLE_CREATE}>
            <Button>Опублікувати твір</Button>
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-primary">
          Мої твори ({titles?.totalCount || 0})
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
              <TitleCard 
                key={title.id} 
                title={{
                  ...title,
                  countryOfOrigin: title.countryOfOrigin || '',
                }} 
              />
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
        <div className="text-center py-12 bg-surface rounded-lg">
          <p className="text-text-muted mb-4">Ви ще не опублікували жодного твору</p>
          <Link to={ROUTES.TITLE_CREATE}>
            <Button>Опублікувати перший твір</Button>
          </Link>
        </div>
      )}
    </div>
  );
};
              <p className="text-gray-600 text-sm">Chapters Read</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalChaptersRead}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-600 text-sm">Reading Streak</p>
              <p className="text-3xl font-bold text-gray-900">{stats.readingStreak} days</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
