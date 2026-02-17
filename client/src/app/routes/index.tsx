import { createBrowserRouter } from 'react-router-dom';
import { MainLayout, ProtectedRoute } from '../../shared/components';
import { RegisterPage } from '../../features/auth/pages';
import { CatalogPage } from '../../features/catalog/pages';
import { TitleDetailsPage, CreateTitlePage } from '../../features/title/pages';
import { ChapterEditorPage } from '../../features/chapter';
import { ReaderPage } from '../../features/reader/pages';
import { ReadingListsPage } from '../../features/reading-lists/pages';
import { UserReadingListsPage } from '../../features/reading-lists/pages/UserReadingListsPage';
import { UserListPage } from '../../features/userlists/pages/UserListPage';
import { UserCustomListsPage } from '../../features/userlists/pages/UserCustomListsPage';
import { ProfilePage, UserProfilePage } from '../../features/profile/pages';
import { ChatPage } from '../../features/messages/pages/ChatPage';
import { AdminRoute, AdminDashboard, AdminTitlesPage, AdminTitleEditPage, GenresManagementPage } from '../../features/admin';
import { ROUTES } from '../../core/constants';
import { HomePage } from '../../features/home/pages/HomePage.tsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
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
        path: '/users/:userId/reading-lists',
        element: <UserReadingListsPage />,
      },
      {
        path: '/users/:userId/lists',
        element: <UserCustomListsPage />,
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
            path: ROUTES.USER_LIST,
            element: <UserListPage />,
          },
          {
            path: ROUTES.READING_LIST_STATUS,
            element: <ReadingListsPage />,
          },
          {
            path: ROUTES.PROFILE,
            element: <ProfilePage />,
          },
          {
            path: ROUTES.MESSAGES,
            element: <ChatPage />,
          },
          {
            path: ROUTES.DIRECT_MESSAGE,
            element: <ChatPage />,
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