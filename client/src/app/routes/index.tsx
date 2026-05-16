import { createBrowserRouter } from 'react-router-dom';
import { MainLayout, ProtectedRoute } from '../../shared/components';
import { OAuthCallbackPage, LegacyAuthRedirectPage } from '../../features/auth/pages';
import { CatalogPage } from '../../features/catalog/pages';
import { TitleDetailsPage, CreateTitlePage, ReviewDetailsPage } from '../../features/title/pages';
import { ChapterEditorPage } from '../../features/chapter';
import { ReaderPage } from '../../features/reader/pages';
import { ReadingListsPage } from '../../features/reading-lists/pages';
import { UserReadingListsPage } from '../../features/reading-lists/pages/UserReadingListsPage';
import { UserListPage } from '../../features/userlists/pages/UserListPage';
import { UserCustomListsPage } from '../../features/userlists/pages/UserCustomListsPage';
import { FriendsPage, ProfilePage, ProfileSettingsPage, UserProfilePage } from '../../features/profile/pages';
import { ChatPage } from '../../features/messages/pages/ChatPage';
import { NotificationsPage } from '../../features/notifications';
import { AdminRoute, AdminDashboard, AdminTitlesPage, AdminTitleEditPage, GenresManagementPage, AdminBansPage, AdminReportsPage, AdminNewsPage, AdminNewsEditPage, AdminFaqPage } from '../../features/admin';
import { TeamsPage, TeamDetailsPage, CreateTeamPage } from '../../features/teams';
import { NewsPage, NewsDetailsPage } from '../../features/news';
import { FaqPage } from '../../features/faq';
import { CollectionsPage, CollectionDetailsPage } from '../../features/collections';
import { PaymentResultPage } from '../../features/payments/pages/PaymentResultPage';
import { ForumPage, ForumCategoryPage, ForumThreadPage } from '../../features/forum';
import { ROUTES } from '../../core/constants';
import { HomePage } from '../../features/home/pages/HomePage.tsx';
import { NotFoundPage } from '../../features/home/pages/NotFoundPage';

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
        path: ROUTES.LOGIN,
        element: <LegacyAuthRedirectPage />,
      },
      {
        path: ROUTES.REGISTER,
        element: <LegacyAuthRedirectPage />,
      },
      {
        path: ROUTES.AUTH_CALLBACK,
        element: <OAuthCallbackPage />,
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
        path: ROUTES.REVIEW_DETAILS,
        element: <ReviewDetailsPage />,
      },
      {
        path: ROUTES.TEAMS,
        element: <TeamsPage />,
      },
      {
        path: ROUTES.TEAM_DETAILS,
        element: <TeamDetailsPage />,
      },
      {
        path: ROUTES.NEWS,
        element: <NewsPage />,
      },
      {
        path: ROUTES.NEWS_DETAILS,
        element: <NewsDetailsPage />,
      },
      {
        path: ROUTES.FAQ,
        element: <FaqPage />,
      },
      {
        path: ROUTES.COLLECTIONS,
        element: <CollectionsPage />,
      },
      {
        path: ROUTES.COLLECTION_DETAILS,
        element: <CollectionDetailsPage />,
      },
      {
        path: ROUTES.USER_COLLECTIONS,
        element: <CollectionsPage />,
      },
      {
        path: ROUTES.USER_PROFILE,
        element: <UserProfilePage />,
      },
      {
        path: ROUTES.USER_FRIENDS,
        element: <FriendsPage />,
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
        path: ROUTES.PAYMENT_RESULT,
        element: <PaymentResultPage />,
      },
      {
        path: ROUTES.FORUM,
        element: <ForumPage />,
      },
      {
        path: ROUTES.FORUM_CATEGORY,
        element: <ForumCategoryPage />,
      },
      {
        path: ROUTES.FORUM_THREAD,
        element: <ForumThreadPage />,
      },
      {
        path: ROUTES.NOT_FOUND,
        element: <NotFoundPage />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: ROUTES.TITLE_CREATE,
            element: <CreateTitlePage />,
          },
          {
            path: ROUTES.TEAM_CREATE,
            element: <CreateTeamPage />,
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
            path: ROUTES.PROFILE_SETTINGS,
            element: <ProfileSettingsPage />,
          },
          {
            path: ROUTES.PROFILE_SETTINGS_SECTION,
            element: <ProfileSettingsPage />,
          },
          {
            path: ROUTES.MESSAGES,
            element: <ChatPage />,
          },
          {
            path: ROUTES.DIRECT_MESSAGE,
            element: <ChatPage />,
          },
          {
            path: ROUTES.NOTIFICATIONS,
            element: <NotificationsPage />,
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
          {
            path: ROUTES.ADMIN_BANS,
            element: <AdminBansPage />,
          },
          {
            path: ROUTES.ADMIN_REPORTS,
            element: <AdminReportsPage />,
          },
          {
            path: ROUTES.ADMIN_NEWS,
            element: <AdminNewsPage />,
          },
          {
            path: ROUTES.ADMIN_NEWS_CREATE,
            element: <AdminNewsEditPage />,
          },
          {
            path: ROUTES.ADMIN_NEWS_EDIT,
            element: <AdminNewsEditPage />,
          },
          {
            path: ROUTES.ADMIN_FAQ,
            element: <AdminFaqPage />,
          },
        ],
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
