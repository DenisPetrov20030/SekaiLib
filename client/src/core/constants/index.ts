export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5284/api';

export const TOKEN_STORAGE_KEY = 'refreshToken';
export const ACCESS_TOKEN_STORAGE_KEY = 'accessToken';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  AUTH_CALLBACK: '/auth/callback',
  CATALOG: '/catalog',
  TITLE_DETAILS: '/titles/:id',
  TITLE_CREATE: '/titles/create',
  CHAPTER_CREATE: '/titles/:titleId/chapters/create',
  CHAPTER_EDIT: '/titles/:titleId/chapters/:chapterId/edit',
  READER: '/titles/:titleId/chapters/:chapterNumber',
  READING_LISTS: '/reading-lists',
  READING_LIST_STATUS: '/reading-lists/:status',
  PROFILE: '/profile',
  PROFILE_SETTINGS: '/profile/settings',
  PROFILE_SETTINGS_SECTION: '/profile/settings/:section',
  USER_LIST: '/user-lists/:id',
  USER_PROFILE: '/users/:userId',
  USER_FRIENDS: '/users/:userId/friends',
  MESSAGES: '/messages',
  DIRECT_MESSAGE: '/messages/to/:userId',
  NOTIFICATIONS: '/notifications',
  NEWS: '/news',
  NEWS_DETAILS: '/news/:id',
  FAQ: '/faq',
  ADMIN: '/admin',
  ADMIN_BANS: '/admin/bans',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_NEWS: '/admin/news',
  ADMIN_NEWS_CREATE: '/admin/news/create',
  ADMIN_NEWS_EDIT: '/admin/news/:id',
  ADMIN_FAQ: '/admin/faq',
  ADMIN_TITLES: '/admin/titles',
  ADMIN_TITLE_EDIT: '/admin/titles/:id',
  ADMIN_TITLE_CREATE: '/admin/titles/create',
  ADMIN_GENRES: '/admin/genres',
  TEAMS: '/teams',
  TEAM_DETAILS: '/teams/:teamId',
  TEAM_CREATE: '/teams/create',
  REVIEW_DETAILS: '/titles/:titleId/reviews/:reviewId',
  NOT_FOUND: '/404',
  NEWS: '/news',
  NEWS_DETAILS: '/news/:id',
  FAQ: '/faq',
  ADMIN_BANS: '/admin/bans',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_NEWS: '/admin/news',
  ADMIN_NEWS_CREATE: '/admin/news/create',
  ADMIN_NEWS_EDIT: '/admin/news/:id',
  ADMIN_FAQ: '/admin/faq',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

export const DEBOUNCE_DELAY = 500;

export const READER_SETTINGS_STORAGE_KEY = 'readerSettings';

