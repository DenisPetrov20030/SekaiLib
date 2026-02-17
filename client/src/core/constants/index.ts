export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7054/api';

export const TOKEN_STORAGE_KEY = 'refreshToken';
export const ACCESS_TOKEN_STORAGE_KEY = 'accessToken';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  CATALOG: '/catalog',
  TITLE_DETAILS: '/titles/:id',
  TITLE_CREATE: '/titles/create',
  CHAPTER_CREATE: '/titles/:titleId/chapters/create',
  CHAPTER_EDIT: '/titles/:titleId/chapters/:chapterId/edit',
  READER: '/titles/:titleId/chapters/:chapterNumber',
  READING_LISTS: '/reading-lists',
  READING_LIST_STATUS: '/reading-lists/:status',
  PROFILE: '/profile',
  USER_LIST: '/user-lists/:id',
  USER_PROFILE: '/users/:userId',
  MESSAGES: '/messages',
  DIRECT_MESSAGE: '/messages/to/:userId',
  ADMIN: '/admin',
  ADMIN_TITLES: '/admin/titles',
  ADMIN_TITLE_EDIT: '/admin/titles/:id',
  ADMIN_TITLE_CREATE: '/admin/titles/create',
  ADMIN_GENRES: '/admin/genres',
  NOT_FOUND: '/404',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

export const DEBOUNCE_DELAY = 500;

export const READER_SETTINGS_STORAGE_KEY = 'readerSettings';
