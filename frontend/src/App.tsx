import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Layout from './components/layout/Layout';

import Home from './pages/home/Home';
import VideoDetail from './pages/video-detail/VideoDetail';
import VideoListingCard from './pages/video-listing/VideoListingCard';
import VideoListingList from './pages/video-listing/VideoListingList';
import ChannelEmptyVideo from './pages/channel/ChannelEmptyVideo';
import ChannelVideoList from './pages/channel/ChannelVideoList';
import ChannelEmptyPlaylist from './pages/channel/ChannelEmptyPlaylist';
import ChannelPlaylist from './pages/channel/ChannelPlaylist';
import ChannelPlaylistVideos from './pages/channel/ChannelPlaylistVideos';
import ChannelEmptyTweet from './pages/channel/ChannelEmptyTweet';
import ChannelTweets from './pages/channel/ChannelTweets';
import ChannelEmptySubscribed from './pages/channel/ChannelEmptySubscribed';
import ChannelSubscribed from './pages/channel/ChannelSubscribed';
import MyChannelEmptyVideo from './pages/channel/MyChannelEmptyVideo';
import MyChannelEmptyTweet from './pages/channel/MyChannelEmptyTweet';
import EditPersonalInfo from './pages/settings/EditPersonalInfo';
import EditChannelInfo from './pages/settings/EditChannelInfo';
import ChangePassword from './pages/settings/ChangePassword';
import AdminDashboard from './pages/admin/AdminDashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import NotFound from './pages/not-found/NotFound';
import SearchResults from './pages/search/SearchResults';
import LikedVideos from './pages/liked/LikedVideos';
import History from './pages/history/History';
import MyContent from './pages/my-content/MyContent';
import Collections from './pages/collections/Collections';
import Subscribers from './pages/subscribers/Subscribers';
import Support from './pages/support/Support';
import Terms from './pages/legal/Terms';
import Privacy from './pages/legal/Privacy';

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
