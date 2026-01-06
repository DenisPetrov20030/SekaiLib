import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout, ProtectedRoute } from '../../shared/components';
import { RegisterPage } from '../../features/auth/pages';
import { CatalogPage } from '../../features/catalog/pages';
import { TitleDetailsPage } from '../../features/title/pages';
import { ReaderPage } from '../../features/reader/pages';
import { ReadingListsPage } from '../../features/reading-lists/pages';
import { ProfilePage } from '../../features/profile/pages';
import { AdminRoute, AdminDashboard, AdminTitlesPage, AdminTitleEditPage } from '../../features/admin';
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
        path: ROUTES.READER,
        element: <ReaderPage />,
      },
      {
        element: <ProtectedRoute />,
        children: [
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
