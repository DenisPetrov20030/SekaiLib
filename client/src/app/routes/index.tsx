import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout, ProtectedRoute } from '../../shared/components';
import { RegisterPage } from '../../features/auth/pages';
import { CatalogPage } from '../../features/catalog/pages';
import { TitleDetailsPage, CreateTitlePage } from '../../features/title/pages';
import { ChapterEditorPage } from '../../features/chapter';
import { ReaderPage } from '../../features/reader/pages';
import { ReadingListsPage } from '../../features/reading-lists/pages';
import { ProfilePage, UserProfilePage } from '../../features/profile/pages';
import { AdminRoute, AdminDashboard, AdminTitlesPage, AdminTitleEditPage, GenresManagementPage } from '../../features/admin';
import { ROUTES } from '../../core/constants';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.CATALOG} replace />,
      },
      {
        path: ROUTES.REGISTER,
        element: <RegisterPage />,
      },
      {
        path: ROUTES.CATALOG,
        element: <CatalogPage />,
      },
      {
        path: ROUTES.TITLE_DETAILS,
        element: <TitleDetailsPage />,
      },
      {
        path: ROUTES.USER_PROFILE,
        element: <UserProfilePage />,
      },
      {
        path: ROUTES.READER,
        element: <ReaderPage />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: ROUTES.TITLE_CREATE,
            element: <CreateTitlePage />,
          },
          {
            path: ROUTES.CHAPTER_CREATE,
            element: <ChapterEditorPage />,
          },
          {
            path: ROUTES.CHAPTER_EDIT,
            element: <ChapterEditorPage />,
          },
          {
            path: ROUTES.READING_LISTS,
            element: <ReadingListsPage />,
          },
          {
            path: ROUTES.READING_LIST_STATUS,
            element: <ReadingListsPage />,
          },
          {
            path: ROUTES.PROFILE,
            element: <ProfilePage />,
          },
        ],
      },
      {
        element: <AdminRoute />,
        children: [
          {
            path: ROUTES.ADMIN,
            element: <AdminDashboard />,
          },
          {
            path: ROUTES.ADMIN_TITLES,
            element: <AdminTitlesPage />,
          },
          {
            path: ROUTES.ADMIN_GENRES,
            element: <GenresManagementPage />,
          },
          {
            path: ROUTES.ADMIN_TITLE_CREATE,
            element: <AdminTitleEditPage />,
          },
          {
            path: ROUTES.ADMIN_TITLE_EDIT,
            element: <AdminTitleEditPage />,
          },
        ],
      },
    ],
  },
]);
