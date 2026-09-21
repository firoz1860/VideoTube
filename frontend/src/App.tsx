import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Layout from './components/layout/Layout';

// Home is the landing route — keep it in the initial bundle so the first
// paint needs no extra chunk request. Everything else is code-split and
// loaded on demand, which keeps the initial download small and startup fast.
import Home from './pages/home/Home';

const VideoDetail = lazy(() => import('./pages/video-detail/VideoDetail'));
const VideoListingCard = lazy(() => import('./pages/video-listing/VideoListingCard'));
const VideoListingList = lazy(() => import('./pages/video-listing/VideoListingList'));
const ChannelEmptyVideo = lazy(() => import('./pages/channel/ChannelEmptyVideo'));
const ChannelVideoList = lazy(() => import('./pages/channel/ChannelVideoList'));
const ChannelEmptyPlaylist = lazy(() => import('./pages/channel/ChannelEmptyPlaylist'));
const ChannelPlaylist = lazy(() => import('./pages/channel/ChannelPlaylist'));
const ChannelPlaylistVideos = lazy(() => import('./pages/channel/ChannelPlaylistVideos'));
const ChannelEmptyTweet = lazy(() => import('./pages/channel/ChannelEmptyTweet'));
const ChannelTweets = lazy(() => import('./pages/channel/ChannelTweets'));
const ChannelEmptySubscribed = lazy(() => import('./pages/channel/ChannelEmptySubscribed'));
const ChannelSubscribed = lazy(() => import('./pages/channel/ChannelSubscribed'));
const MyChannelEmptyVideo = lazy(() => import('./pages/channel/MyChannelEmptyVideo'));
const MyChannelEmptyTweet = lazy(() => import('./pages/channel/MyChannelEmptyTweet'));
const EditPersonalInfo = lazy(() => import('./pages/settings/EditPersonalInfo'));
const EditChannelInfo = lazy(() => import('./pages/settings/EditChannelInfo'));
const ChangePassword = lazy(() => import('./pages/settings/ChangePassword'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const NotFound = lazy(() => import('./pages/not-found/NotFound'));
const SearchResults = lazy(() => import('./pages/search/SearchResults'));
const LikedVideos = lazy(() => import('./pages/liked/LikedVideos'));
const History = lazy(() => import('./pages/history/History'));
const MyContent = lazy(() => import('./pages/my-content/MyContent'));
const Collections = lazy(() => import('./pages/collections/Collections'));
const Subscribers = lazy(() => import('./pages/subscribers/Subscribers'));
const Support = lazy(() => import('./pages/support/Support'));
const Terms = lazy(() => import('./pages/legal/Terms'));
const Privacy = lazy(() => import('./pages/legal/Privacy'));

const RouteFallback = () => (
  <div className="flex items-center justify-center py-24">
    <div
      className="w-9 h-9 rounded-full animate-spin"
      style={{ border: '3px solid rgba(124,58,237,0.25)', borderTopColor: '#7c3aed' }}
    />
  </div>
);

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="container mx-auto px-4 py-10 text-center">Checking session...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-[#0F1729] text-white flex items-center justify-center">Checking session...</div>;
  }

  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
};

const AppShell = () => (
  <Layout>
    <Outlet />
  </Layout>
);

const AppRoutes = () => {
  return (
    <ThemeProvider>
      <DataProvider>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <Register />
                </PublicOnlyRoute>
              }
            />
            <Route element={<AppShell />}>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/video/:id" element={<VideoDetail />} />
              <Route path="/videos/card" element={<VideoListingCard />} />
              <Route path="/videos/list" element={<VideoListingList />} />
              <Route path="/channel/:id" element={<ChannelVideoList />} />
              <Route path="/channel/:id/empty" element={<ChannelEmptyVideo />} />
              <Route path="/channel/:id/playlists/empty" element={<ChannelEmptyPlaylist />} />
              <Route path="/channel/:id/playlists" element={<ChannelPlaylist />} />
              <Route path="/channel/:id/playlist/:playlistId" element={<ChannelPlaylistVideos />} />
              <Route path="/channel/:id/tweets/empty" element={<ChannelEmptyTweet />} />
              <Route path="/channel/:id/tweets" element={<ChannelTweets />} />
              <Route path="/channel/:id/subscribed/empty" element={<ChannelEmptySubscribed />} />
              <Route path="/channel/:id/subscribed" element={<ChannelSubscribed />} />
              <Route path="/liked" element={<PrivateRoute><LikedVideos /></PrivateRoute>} />
              <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
              <Route path="/my-content" element={<PrivateRoute><MyContent /></PrivateRoute>} />
              <Route path="/collections" element={<PrivateRoute><Collections /></PrivateRoute>} />
              <Route path="/subscribers" element={<PrivateRoute><Subscribers /></PrivateRoute>} />
              <Route path="/support" element={<Support />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/profile" element={<PrivateRoute><EditPersonalInfo /></PrivateRoute>} />
              <Route path="/my-channel/empty" element={<PrivateRoute><MyChannelEmptyVideo /></PrivateRoute>} />
              <Route path="/my-channel/tweets/empty" element={<PrivateRoute><MyChannelEmptyTweet /></PrivateRoute>} />
              <Route path="/settings/personal" element={<PrivateRoute><EditPersonalInfo /></PrivateRoute>} />
              <Route path="/settings/channel" element={<PrivateRoute><EditChannelInfo /></PrivateRoute>} />
              <Route path="/settings/password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />
              <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </DataProvider>
    </ThemeProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
