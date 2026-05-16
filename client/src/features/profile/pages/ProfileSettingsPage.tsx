import { useEffect, useState } from 'react';
import { Link, NavLink, useParams } from 'react-router-dom';
import { useAppDispatch } from '../../../app/store/hooks';
import { getCurrentUser } from '../../auth/store/authSlice';
import { fetchProfile } from '../store/profileSlice';
import { usersApi, userListsApi, blocksApi, authApi, genresApi, paymentsApi } from '../../../core/api';
import type { PurchaseDto } from '../../../core/api';
import type { UserProfile } from '../../../core/types';
import { Gender } from '../../../core/types';
import type { UserListDto } from '../../../core/api/userLists';
import type { BlockedUserDto, LinkedAccountDto } from '../../../core/types/dtos';
import type { Genre } from '../../../core/api/genres';
import { Button } from '../../../shared/components';
import { ROUTES } from '../../../core/constants';

type ProfileSettingsSection = {
  key: string;
  label: string;
};

type ProfileVisibility = 'public' | 'friends-only' | 'except-ignore-list' | 'private';

const PROFILE_SETTINGS_SECTIONS: ProfileSettingsSection[] = [
  { key: 'profile', label: 'Профіль' },
  { key: 'notifications', label: 'Сповіщення' },
  { key: 'privacy', label: 'Приватність' },
  { key: 'ignore-list', label: 'Ігнор-лист' },
  { key: 'content-filter', label: 'Фільтр контенту' },
  { key: 'security-login', label: 'Безпека і вхід' },
  { key: 'payments', label: 'Платежі' },
];

const PROFILE_VISIBILITY_STORAGE_KEY = 'profile_visibility';

const PROFILE_VISIBILITY_OPTIONS: Array<{ value: ProfileVisibility; label: string }> = [
  { value: 'public', label: 'Публічний' },
  { value: 'friends-only', label: 'Тільки для друзів' },
  { value: 'except-ignore-list', label: 'Для всіх, крім ігнор-листа' },
  { value: 'private', label: 'Приватний' },
];

// Стандартні списки (ReadingStatus) — назви совпадают с вкладкой "Мої списки"
const READING_LISTS = [
  { id: 0, label: 'Читаю' },
  { id: 1, label: 'Заплановано' },
  { id: 2, label: 'Завершено' },
  { id: 3, label: 'Припинено' },
  { id: 4, label: 'Улюблені' },
];

const getSectionRoute = (sectionKey: string) =>
  ROUTES.PROFILE_SETTINGS_SECTION.replace(':section', sectionKey);

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }
  return fallback;
};

export const ProfileSettingsPage = () => {
  const dispatch = useAppDispatch();
  const { section } = useParams<{ section?: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [profileVisibility, setProfileVisibility] = useState<ProfileVisibility>('public');
  
  // Локальні стейти для основної інформації
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState<Gender>(Gender.NotSpecified);
  const [aboutMe, setAboutMe] = useState('');
  
  // Для вкладки сповіщень
  const [userLists, setUserLists] = useState<UserListDto[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);

  // Ігнор-лист
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserDto[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  // Фільтр контенту
  const [allGenres, setAllGenres] = useState<Genre[]>([]);
  const [loadingGenres, setLoadingGenres] = useState(false);
  const [blockedGenreIds, setBlockedGenreIds] = useState<string[]>([]);
  const [savingGenres, setSavingGenres] = useState(false);

  // Безпека і вхід
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccountDto[]>([]);
  const [loadingLinked, setLoadingLinked] = useState(false);
  const [unlinkingProvider, setUnlinkingProvider] = useState<string | null>(null);

  // Платежі
  const [purchases, setPurchases] = useState<PurchaseDto[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);

  const currentSectionKey = section ?? 'profile';
  const currentSection = PROFILE_SETTINGS_SECTIONS.find((item) => item.key === currentSectionKey) ?? null;

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const data = await usersApi.getCurrentProfile();
        
        // Ініціалізуємо масив статусів, якщо бекенд повернув null/undefined
        if (!(data as any).notifyListStatuses) {
          (data as any).notifyListStatuses = [0]; // За замовчуванням увімкнено тільки "Читаю" (id: 0)
        }
        // Ініціалізуємо булеві налаштування, якщо їх немає
        if ((data as any).notifyTitleCompleted === undefined) {
          (data as any).notifyTitleCompleted = false;
        }
        if ((data as any).notifyFriendRequests === undefined) {
          (data as any).notifyFriendRequests = false;
        }

        setProfile(data);
        setUsername(data.username);
        setGender(data.gender);
        setAboutMe(data.aboutMe ?? '');
        if (data.blockedGenres) {
          setBlockedGenreIds(data.blockedGenres);
        }
      } catch (err) {
        console.error('Не вдалося завантажити профіль для налаштувань:', err);
        setLoadError(getErrorMessage(err, 'Не вдалося завантажити дані профілю.'));
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    const storedVisibility = localStorage.getItem(PROFILE_VISIBILITY_STORAGE_KEY);
    if (
      storedVisibility === 'public' ||
      storedVisibility === 'friends-only' ||
      storedVisibility === 'except-ignore-list' ||
      storedVisibility === 'private'
    ) {
      setProfileVisibility(storedVisibility);
    }
    
    // Також завантажуємо з профілю, якщо є
    if (profile && (profile as any).profileVisibility !== undefined) {
      const visibilityMap: Record<number, ProfileVisibility> = {
        0: 'public',
        1: 'friends-only',
        2: 'except-ignore-list',
        3: 'private',
      };
      const vis = visibilityMap[(profile as any).profileVisibility];
      if (vis) {
        setProfileVisibility(vis);
        localStorage.setItem(PROFILE_VISIBILITY_STORAGE_KEY, vis);
      }
    }
  }, [profile]);

  // Загружаємо списки користувача при переключенні на вкладку сповіщень
  const loadUserLists = async () => {
    if (loadingLists || userLists.length > 0) return;
    
    try {
      setLoadingLists(true);
      const lists = await userListsApi.getMyLists();
      setUserLists(lists);
    } catch (err) {
      console.error('Не вдалося завантажити списки:', err);
    } finally {
      setLoadingLists(false);
    }
  };

  useEffect(() => {
    if (currentSectionKey === 'notifications' && userLists.length === 0) {
      loadUserLists();
    }
    if (currentSectionKey === 'ignore-list') {
      loadBlockedUsers();
    }
    if (currentSectionKey === 'content-filter') {
      loadGenres();
    }
    if (currentSectionKey === 'security-login') {
      loadLinkedAccounts();
    }
    if (currentSectionKey === 'payments') {
      loadPurchases();
    }
  }, [currentSectionKey]);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setSaveError(null);
      setSaveMessage(null);
      const updated = await usersApi.updateCurrentProfile({
        username,
        gender,
        aboutMe: aboutMe.trim() ? aboutMe.trim() : null,
      });
      setProfile({ ...profile, ...updated });
      setUsername(updated.username);
      setGender(updated.gender);
      setAboutMe(updated.aboutMe ?? '');
      
      setSaveMessage('Дані профілю збережено.');
      setTimeout(() => setSaveMessage(null), 3000);
      
      dispatch(getCurrentUser());
      dispatch(fetchProfile());
    } catch (err) {
      setSaveError(getErrorMessage(err, 'Не вдалося зберегти профіль.'));
      console.error('Не вдалося зберегти профіль:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!profile) return;
    try {
      setSaving(true);
      setSaveError(null);
      setSaveMessage(null);
      
      // Отправляємо оновлені налаштування сповіщень на бекенд
      const notifyListStatuses = ((profile as any).notifyListStatuses || []) as number[];
      const notifyUserListIds = ((profile as any).notifyUserListIds || []) as string[];
      const notifyTitleCompleted = !!(profile as any).notifyTitleCompleted;
      const notifyFriendRequests = !!(profile as any).notifyFriendRequests;
      
      const updated = await usersApi.updateCurrentProfile({
        username,
        gender,
        aboutMe: aboutMe ? aboutMe.trim() : null,
        notifyListStatuses,
        notifyUserListIds,
        notifyTitleCompleted,
        notifyFriendRequests,
      });
      
      setProfile(updated);
      setSaveMessage('Налаштування сповіщень збережено.');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveError(getErrorMessage(err, 'Не вдалося зберегти налаштування.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrivacy = async () => {
    if (!profile) return;
    try {
      setSaving(true);
      setSaveError(null);
      setSaveMessage(null);

      // Отправляємо оновлене налаштування приватності на бекенд
      const updated = await usersApi.updateCurrentProfile({
        username,
        gender,
        aboutMe: aboutMe ? aboutMe.trim() : null,
        profileVisibility: profileVisibility === 'public' ? 0 : profileVisibility === 'friends-only' ? 1 : profileVisibility === 'except-ignore-list' ? 2 : 3,
      });
      
      setProfile(updated);
      setSaveMessage('Налаштування приватності збережено.');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveError(getErrorMessage(err, 'Не вдалося зберегти налаштування приватності.'));
    } finally {
      setSaving(false);
    }
  };

  // Функція для перемикання чекбокса конкретного списку
  const toggleListNotification = (listId: number) => {
    if (!profile) return;
    
    const currentStatuses: number[] = (profile as any).notifyListStatuses || [];
    const newStatuses = currentStatuses.includes(listId)
      ? currentStatuses.filter((id) => id !== listId)
      : [...currentStatuses, listId];

    setProfile({ ...profile, notifyListStatuses: newStatuses } as any);
  };

  // Ігнор-лист: завантаження і розблокування
  const loadBlockedUsers = async () => {
    if (loadingBlocked) return;
    try {
      setLoadingBlocked(true);
      const data = await blocksApi.getBlockedUsersWithDetails();
      setBlockedUsers(data);
    } catch (err) {
      console.error('Не вдалося завантажити ігнор-лист:', err);
    } finally {
      setLoadingBlocked(false);
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      setUnblockingId(userId);
      await blocksApi.unblock(userId);
      setBlockedUsers((prev) => prev.filter((u) => u.userId !== userId));
    } catch (err) {
      console.error('Помилка при розблокуванні:', err);
    } finally {
      setUnblockingId(null);
    }
  };

  // Фільтр контенту: завантаження жанрів і збереження
  const loadGenres = async () => {
    if (loadingGenres || allGenres.length > 0) return;
    try {
      setLoadingGenres(true);
      const data = await genresApi.getAll();
      setAllGenres(data);
    } catch (err) {
      console.error('Не вдалося завантажити жанри:', err);
    } finally {
      setLoadingGenres(false);
    }
  };

  const toggleBlockedGenre = (genreId: string) => {
    setBlockedGenreIds((prev) =>
      prev.includes(genreId) ? prev.filter((id) => id !== genreId) : [...prev, genreId]
    );
  };

  const handleSaveGenreFilter = async () => {
    try {
      setSavingGenres(true);
      setSaveError(null);
      setSaveMessage(null);
      await usersApi.updateGenreFilter(blockedGenreIds);
      setSaveMessage('Фільтр контенту збережено.');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveError(getErrorMessage(err, 'Не вдалося зберегти фільтр контенту.'));
    } finally {
      setSavingGenres(false);
    }
  };

  // Безпека і вхід: зміна пароля
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError('Паролі не збігаються.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Новий пароль має містити щонайменше 6 символів.');
      return;
    }
    try {
      setSavingPassword(true);
      setPasswordError(null);
      setPasswordMessage(null);
      await authApi.changePassword(currentPassword, newPassword);
      setPasswordMessage('Пароль успішно змінено.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMessage(null), 4000);
    } catch (err) {
      setPasswordError(getErrorMessage(err, 'Не вдалося змінити пароль.'));
    } finally {
      setSavingPassword(false);
    }
  };

  // Безпека і вхід: завантаження прив'язаних акаунтів
  const loadLinkedAccounts = async () => {
    if (loadingLinked) return;
    try {
      setLoadingLinked(true);
      const data = await authApi.getLinkedAccounts();
      setLinkedAccounts(data);
    } catch (err) {
      console.error("Не вдалося завантажити прив'язані акаунти:", err);
    } finally {
      setLoadingLinked(false);
    }
  };

  const handleUnlinkAccount = async (provider: string) => {
    try {
      setUnlinkingProvider(provider);
      await authApi.unlinkAccount(provider);
      setLinkedAccounts((prev) => prev.filter((a) => a.provider !== provider));
    } catch (err) {
      setPasswordError(getErrorMessage(err, 'Не вдалося відв\'язати акаунт.'));
    } finally {
      setUnlinkingProvider(null);
    }
  };

  const loadPurchases = async () => {
    if (loadingPurchases) return;
    try {
      setLoadingPurchases(true);
      const data = await paymentsApi.getMyPurchases();
      setPurchases(data);
    } catch (err) {
      console.error('Не вдалося завантажити покупки:', err);
    } finally {
      setLoadingPurchases(false);
    }
  };

  const genderOptions = [
    { value: Gender.NotSpecified, label: 'Не вказаний' },
    { value: Gender.Male, label: 'Чоловік' },
    { value: Gender.Female, label: 'Жінка' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Налаштування профілю</h1>
        </div>
        <Link to={ROUTES.PROFILE}>
          <Button variant="secondary">Назад до профілю</Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="bg-surface rounded-lg p-2 shadow-sm border border-divider h-fit">
          <nav className="space-y-1">
            {PROFILE_SETTINGS_SECTIONS.map((item) => {
              const to = getSectionRoute(item.key);

              return (
                <NavLink
                  key={item.key}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-md px-3 py-3 text-sm transition-colors ${
                      isActive
                        ? 'bg-surface-hover text-text-primary'
                        : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                    }`
                  }
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-hover text-text-muted text-xs font-semibold">
                    {item.label.charAt(0)}
                  </span>
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <section className="bg-surface rounded-lg p-6 shadow-sm border border-divider min-h-[420px]">
          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center text-text-muted">
              Завантаження...
            </div>
          ) : loadError ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-5 text-red-200">
              {loadError}
            </div>
          ) : currentSectionKey === 'profile' ? (
            <div>
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Вкладка профілю</p>
                <h2 className="text-2xl font-bold text-text-primary mt-2">Інформація</h2>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Нікнейм</label>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-md border border-divider bg-background px-4 py-3 text-text-primary outline-none transition-colors focus:border-primary-500"
                    placeholder="Ваш нікнейм"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Стать</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(Number(e.target.value) as Gender)}
                    className="w-full rounded-md border border-divider bg-background px-4 py-3 text-text-primary outline-none transition-colors focus:border-primary-500"
                  >
                    {genderOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Про себе</label>
                  <textarea
                    value={aboutMe}
                    onChange={(e) => setAboutMe(e.target.value)}
                    className="w-full min-h-36 rounded-md border border-divider bg-background px-4 py-3 text-text-primary outline-none transition-colors focus:border-primary-500"
                    placeholder="Розкажіть про себе..."
                  />
                </div>

                {saveMessage && (
                  <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-200">
                    {saveMessage}
                  </div>
                )}

                {saveError && (
                  <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">
                    {saveError}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? 'Збереження...' : 'Зберегти зміни'}
                  </Button>
                </div>
              </div>
            </div>
          ) : currentSectionKey === 'notifications' ? (
            <div>
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Вкладка профілю</p>
                <h2 className="text-2xl font-bold text-text-primary mt-2">Сповіщення</h2>
              </div>

              <div className="space-y-6">
                {/* ЗАГАЛЬНІ СПОВІЩЕННЯ */}
                <div className="bg-surface rounded-lg p-4 border border-divider">
                  <h3 className="text-lg font-semibold text-text-primary mb-3">Загальні</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-divider text-primary-600 focus:ring-primary-500 bg-background"
                        checked={!!(profile && (profile as any).notifyTitleCompleted)}
                        onChange={(e) => {
                          if (!profile) return;
                          setProfile({ ...profile, notifyTitleCompleted: e.target.checked } as any);
                        }}
                      />
                      <span className="text-sm text-text-secondary">Сповіщати про «Завершення» тайтла з моїх списків</span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-divider text-primary-600 focus:ring-primary-500 bg-background"
                        checked={!!(profile && (profile as any).notifyFriendRequests)}
                        onChange={(e) => {
                          if (!profile) return;
                          setProfile({ ...profile, notifyFriendRequests: e.target.checked } as any);
                        }}
                      />
                      <span className="text-sm text-text-secondary">Сповіщати про заявки в друзі</span>
                    </label>
                  </div>
                </div>

                {/* СПОВІЩЕННЯ ПРО РОЗДІЛИ З МОЇХ СПИСКІВ */}
                {loadingLists ? (
                  <div className="bg-surface rounded-lg p-5 border border-divider text-center">
                    <p className="text-text-muted">Завантаження ваших списків...</p>
                  </div>
                ) : (
                  <div className="bg-surface rounded-lg p-5 border border-divider">
                    <div className="flex flex-col mb-4">
                      <h3 className="text-lg font-semibold text-text-primary">Розділи з моїх списків</h3>
                      <p className="text-sm text-text-secondary mt-1">
                        Оберіть списки, для яких ви хочете отримувати сповіщення про нові розділи:
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {/* Стандартні списки (ReadingStatus) */}
                      {READING_LISTS.map((list) => {
                        const isEnabled = ((profile as any).notifyListStatuses || []).includes(list.id);

                        return (
                          <label 
                            key={`status-${list.id}`} 
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer select-none ${
                              isEnabled 
                                ? 'bg-primary-500/10 border-primary-500/30' 
                                : 'bg-surface-hover/50 border-divider hover:bg-surface-hover hover:border-white/20'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-divider text-primary-600 focus:ring-primary-500 bg-background"
                              checked={isEnabled}
                              onChange={() => toggleListNotification(list.id)}
                            />
                            <span className={`text-sm font-medium ${isEnabled ? 'text-text-primary' : 'text-text-secondary'}`}>
                              {list.label}
                            </span>
                          </label>
                        );
                      })}

                      {/* Кастомні списки користувача */}
                      {userLists.map((list) => {
                        const isEnabled = ((profile as any).notifyUserListIds || []).includes(list.id);

                        return (
                          <label 
                            key={`custom-${list.id}`} 
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer select-none ${
                              isEnabled 
                                ? 'bg-primary-500/10 border-primary-500/30' 
                                : 'bg-surface-hover/50 border-divider hover:bg-surface-hover hover:border-white/20'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-divider text-primary-600 focus:ring-primary-500 bg-background"
                              checked={isEnabled}
                              onChange={() => {
                                if (!profile) return;
                                const currentListIds: string[] = (profile as any).notifyUserListIds || [];
                                const newListIds = currentListIds.includes(list.id)
                                  ? currentListIds.filter((id) => id !== list.id)
                                  : [...currentListIds, list.id];
                                setProfile({ ...profile, notifyUserListIds: newListIds } as any);
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <span className={`text-sm font-medium block ${isEnabled ? 'text-text-primary' : 'text-text-secondary'}`}>
                                {list.name}
                              </span>
                              <span className="text-xs text-text-muted block">
                                {list.titlesCount} тайтлів
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* КНОПКА ЗБЕРЕЖЕННЯ */}
                <div className="pt-2 border-t border-divider">
                  <Button onClick={handleSaveNotifications} disabled={saving}>
                    {saving ? 'Збереження...' : 'Зберегти налаштування'}
                  </Button>

                  {saveMessage && (
                    <div className="mt-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-200 text-sm">
                      {saveMessage}
                    </div>
                  )}
                  {saveError && (
                    <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200 text-sm">
                      {saveError}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : currentSectionKey === 'privacy' ? (
            <div>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Вкладка профілю</p>
                  <h2 className="text-2xl font-bold text-text-primary mt-2">Приватність</h2>
                </div>
                <Button onClick={handleSavePrivacy} disabled={saving}>
                  {saving ? 'Збереження...' : 'Зберегти'}
                </Button>
              </div>

              <div className="bg-surface rounded-lg p-4 border border-divider">
                <label className="block text-sm font-medium text-text-secondary mb-2">Відображення профілю</label>
                <select
                  value={profileVisibility}
                  onChange={(e) => setProfileVisibility(e.target.value as ProfileVisibility)}
                  className="w-full rounded-md border border-divider bg-background px-4 py-3 text-text-primary outline-none transition-colors focus:border-primary-500"
                >
                  {PROFILE_VISIBILITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {saveMessage && (
                <div className="mt-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-200 text-sm">
                  {saveMessage}
                </div>
              )}

              {saveError && (
                <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200 text-sm">
                  {saveError}
                </div>
              )}
            </div>
          ) : currentSectionKey === 'ignore-list' ? (
            <div>
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Вкладка профілю</p>
                <h2 className="text-2xl font-bold text-text-primary mt-2">Ігнор-лист</h2>
                <p className="text-sm text-text-secondary mt-1">
                  Заблоковані користувачі не бачать ваші коментарі та не можуть надсилати вам повідомлення.
                </p>
              </div>

              {loadingBlocked ? (
                <div className="py-10 text-center text-text-muted">Завантаження...</div>
              ) : blockedUsers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-divider bg-surface-hover/40 px-6 py-10 text-center">
                  <p className="text-text-secondary">Ваш ігнор-лист порожній.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {blockedUsers.map((user) => (
                    <div
                      key={user.userId}
                      className="flex items-center gap-4 rounded-lg border border-divider bg-surface-hover/40 px-4 py-3"
                    >
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.username}
                          className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-surface-hover flex items-center justify-center flex-shrink-0">
                          <span className="text-text-muted text-sm font-semibold">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary">{user.username}</p>
                        <p className="text-xs text-text-muted">
                          Заблоковано {new Date(user.blockedAt).toLocaleDateString('uk-UA')}
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() => handleUnblock(user.userId)}
                        disabled={unblockingId === user.userId}
                      >
                        {unblockingId === user.userId ? 'Розблокування...' : 'Розблокувати'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : currentSectionKey === 'content-filter' ? (
            <div>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Вкладка профілю</p>
                  <h2 className="text-2xl font-bold text-text-primary mt-2">Фільтр контенту</h2>
                  <p className="text-sm text-text-secondary mt-1">
                    Тайтли з обраними жанрами не відображатимуться у каталозі.
                  </p>
                </div>
                <Button onClick={handleSaveGenreFilter} disabled={savingGenres}>
                  {savingGenres ? 'Збереження...' : 'Зберегти'}
                </Button>
              </div>

              {loadingGenres ? (
                <div className="py-10 text-center text-text-muted">Завантаження жанрів...</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {allGenres.map((genre) => {
                    const isBlocked = blockedGenreIds.includes(genre.id);
                    return (
                      <label
                        key={genre.id}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer select-none transition-all ${
                          isBlocked
                            ? 'bg-red-500/10 border-red-500/30 text-red-300'
                            : 'bg-surface-hover/40 border-divider text-text-secondary hover:bg-surface-hover hover:border-white/20'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isBlocked}
                          onChange={() => toggleBlockedGenre(genre.id)}
                          className="h-4 w-4 rounded border-divider bg-background"
                        />
                        <span className="text-sm font-medium">{genre.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {saveMessage && (
                <div className="mt-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-200 text-sm">
                  {saveMessage}
                </div>
              )}
              {saveError && (
                <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200 text-sm">
                  {saveError}
                </div>
              )}
            </div>
          ) : currentSectionKey === 'security-login' ? (
            <div className="space-y-8">
              <div className="mb-2">
                <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Вкладка профілю</p>
                <h2 className="text-2xl font-bold text-text-primary mt-2">Безпека і вхід</h2>
              </div>

              {/* Зміна пароля */}
              <div className="rounded-lg border border-divider bg-surface-hover/40 p-5">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Зміна пароля</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Поточний пароль</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full rounded-md border border-divider bg-background px-4 py-3 text-text-primary outline-none transition-colors focus:border-primary-500"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Новий пароль</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-md border border-divider bg-background px-4 py-3 text-text-primary outline-none transition-colors focus:border-primary-500"
                      placeholder="Мінімум 6 символів"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Підтвердження нового пароля</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-md border border-divider bg-background px-4 py-3 text-text-primary outline-none transition-colors focus:border-primary-500"
                      placeholder="••••••••"
                    />
                  </div>

                  {passwordMessage && (
                    <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-200 text-sm">
                      {passwordMessage}
                    </div>
                  )}
                  {passwordError && (
                    <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200 text-sm">
                      {passwordError}
                    </div>
                  )}

                  <Button
                    onClick={handleChangePassword}
                    disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
                  >
                    {savingPassword ? 'Збереження...' : 'Змінити пароль'}
                  </Button>
                </div>
              </div>

              {/* Прив'язані акаунти */}
              <div className="rounded-lg border border-divider bg-surface-hover/40 p-5">
                <h3 className="text-lg font-semibold text-text-primary mb-1">Прив'язані акаунти</h3>
                <p className="text-sm text-text-secondary mb-4">
                  Управляйте входом через зовнішні сервіси. Відв'язати акаунт можна лише якщо у вас є пароль або інший прив'язаний сервіс.
                </p>

                {loadingLinked ? (
                  <div className="py-4 text-center text-text-muted text-sm">Завантаження...</div>
                ) : linkedAccounts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-divider px-5 py-6 text-center">
                    <p className="text-text-secondary text-sm">Немає прив'язаних зовнішніх акаунтів.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {linkedAccounts.map((account) => (
                      <div
                        key={account.provider}
                        className="flex items-center gap-4 rounded-lg border border-divider px-4 py-3"
                      >
                        <div className="h-9 w-9 rounded-full bg-surface-hover flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-text-primary uppercase">
                            {account.provider.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary capitalize">{account.provider}</p>
                          <p className="text-xs text-text-muted">
                            Прив'язано {new Date(account.linkedAt).toLocaleDateString('uk-UA')}
                          </p>
                        </div>
                        <Button
                          variant="secondary"
                          onClick={() => handleUnlinkAccount(account.provider)}
                          disabled={unlinkingProvider === account.provider}
                        >
                          {unlinkingProvider === account.provider ? "Відв'язка..." : "Відв'язати"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : currentSectionKey === 'payments' ? (
            <div className="space-y-6">
              <div className="mb-2">
                <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Вкладка профілю</p>
                <h2 className="text-2xl font-bold text-text-primary mt-2">Платежі та покупки</h2>
              </div>
              {loadingPurchases ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                </div>
              ) : purchases.length === 0 ? (
                <div className="rounded-xl border border-dashed border-divider bg-surface-hover/40 px-6 py-10 text-center">
                  <svg className="w-10 h-10 text-text-muted mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <p className="text-text-secondary">У вас поки немає придбаних розділів.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {purchases.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg border border-divider bg-surface-hover/40 px-4 py-3">
                      <div>
                        <p className="text-text-primary font-medium text-sm">
                          {p.titleName ?? 'Невідомий твір'} — Глава {p.chapterNumber}
                        </p>
                        <p className="text-text-muted text-xs mt-0.5">
                          {p.chapterName ?? ''} · {new Date(p.purchasedAt).toLocaleDateString('uk-UA')}
                        </p>
                      </div>
                      <span className="text-primary-400 font-semibold text-sm">{p.amountPaid.toFixed(2)} ₴</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : currentSection ? (
            <>
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Вкладка профілю</p>
                <h2 className="text-2xl font-bold text-text-primary mt-2">{currentSection.label}</h2>
              </div>
              <div className="rounded-xl border border-dashed border-divider bg-surface-hover/40 px-6 py-10 text-center">
                <p className="text-text-secondary">Сторінка поки порожня.</p>
              </div>
            </>
          ) : (
            <div className="flex h-full min-h-[360px] items-center justify-center rounded-xl border border-dashed border-divider bg-surface-hover/40 px-6 text-center">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Оберіть вкладку</h2>
                <p className="text-text-secondary mt-2">
                  Зліва показано список розділів профілю. Кожен з них відкриває окрему пусту сторінку.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};