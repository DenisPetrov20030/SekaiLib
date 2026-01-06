import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { fetchProfile, fetchStatistics } from '../store';
import { formatDate } from '../../../core/utils';

export const ProfilePage = () => {
  const dispatch = useAppDispatch();
  const { user, stats, loading } = useAppSelector((state) => state.profile);

  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchStatistics());
  }, [dispatch]);

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile</h1>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-600">
              {user.username[0].toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{user.username}</h2>
            <p className="text-gray-600">{user.email}</p>
            <p className="text-sm text-gray-500">Member since {formatDate(user.createdAt)}</p>
          </div>
        </div>
      </div>

      {stats && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-600 text-sm">Titles in Lists</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalTitlesInLists}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
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
