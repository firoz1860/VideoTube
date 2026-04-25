import { Menu, Search, X, Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { useNotifications } from '../../hooks/useNotifications';
import Logo from '../common/Logo';
import Button from '../common/Button';
import Input from '../common/Input';
import Avatar from '../common/Avatar';
import NotificationPanel from '../common/NotificationPanel';

interface NavbarProps {
  onMenuClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const { resolvedTheme } = useTheme();
  const { videos, subscriptions } = useData();
  const { permission, notifications, unreadCount, requestPermission, markRead, markAllRead, clearAll } =
    useNotifications(videos, subscriptions, isAuthenticated);

  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const isLight = resolvedTheme === 'light';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    navigate('/');
  };

  const handleBellClick = async () => {
    if (!showNotifications && permission === 'default') {
      await requestPermission();
    }
    setShowNotifications((v) => !v);
    setShowUserMenu(false);
  };

  // theme-derived nav styles
  const navBg = isLight ? 'rgba(255,255,255,0.97)' : 'rgba(15,23,41,0.92)';
  const navBorder = isLight ? 'rgb(226 232 240)' : 'rgba(30,41,59,0.8)';
  const iconColor = isLight ? 'rgb(100 116 139)' : 'rgb(148 163 184)';
  const iconHoverBg = isLight ? 'rgb(241 245 249)' : 'rgb(30 41 59)';
  const dropdownBg = isLight ? '#ffffff' : '#0f172a';
  const dropdownBorder = isLight ? 'rgb(226 232 240)' : 'rgba(51,65,85,0.6)';
  const dropdownDivider = isLight ? 'rgb(241 245 249)' : 'rgb(30 41 59)';
  const dropdownTextPrimary = isLight ? 'rgb(15 23 42)' : 'rgb(248 250 252)';
  const dropdownTextMuted = isLight ? 'rgb(100 116 139)' : 'rgb(148 163 184)';
  const dropdownItemHover = isLight ? 'rgb(248 250 252)' : 'rgb(30 41 59)';

  return (
    <nav
      className="sticky top-0 z-20 border-b"
      style={{
        background: navBg,
        borderColor: navBorder,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        transition: 'background 0.2s, border-color 0.2s',
      }}
    >
      <div className="px-3 sm:px-4 py-2.5">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Hamburger — mobile only */}
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Toggle menu"
            className="md:hidden p-2 rounded-xl transition-colors duration-150"
            style={{ color: iconColor }}
            onMouseEnter={(e) => (e.currentTarget.style.background = iconHoverBg)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Menu size={20} />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0">
            <Logo />
          </Link>

          {/* Search bar — tablet + desktop */}
          <div className="hidden md:block flex-1 mx-2 lg:mx-4 max-w-xl">
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="Search videos, channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search size={16} />}
                className="pr-10"
              />
              <button
                type="submit"
                aria-label="Search"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors duration-150"
                style={{ color: iconColor }}
                onMouseEnter={(e) => (e.currentTarget.style.background = iconHoverBg)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Search size={15} />
              </button>
            </form>
          </div>

          {/* Mobile search toggle */}
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen((v) => !v)}
            aria-label="Toggle search"
            className="md:hidden p-2 rounded-xl transition-colors duration-150"
            style={{ color: iconColor }}
            onMouseEnter={(e) => (e.currentTarget.style.background = iconHoverBg)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            {isMobileSearchOpen ? <X size={18} /> : <Search size={18} />}
          </button>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Notification bell */}
                <div className="relative hidden sm:block" ref={notifRef}>
                  <button
                    onClick={() => void handleBellClick()}
                    aria-label="Notifications"
                    className="relative p-2 rounded-xl transition-colors duration-150"
                    style={{ color: showNotifications ? '#8b5cf6' : iconColor }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = iconHoverBg)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span
                        className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-white font-bold leading-none"
                        style={{
                          fontSize: '9px',
                          background: '#8b5cf6',
                          animation: 'scaleIn 0.2s ease both',
                        }}
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setShowNotifications(false)}
                      />
                      <div className="relative z-30">
                        <NotificationPanel
                          notifications={notifications}
                          permission={permission}
                          onRequestPermission={requestPermission}
                          onMarkRead={markRead}
                          onMarkAllRead={markAllRead}
                          onClear={clearAll}
                          onClose={() => setShowNotifications(false)}
                          resolvedTheme={resolvedTheme}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* User avatar + dropdown */}
                <div className="relative">
                  <button
                    onClick={() => { setShowUserMenu((v) => !v); setShowNotifications(false); }}
                    className="flex items-center gap-2 p-1 rounded-xl transition-colors duration-150"
                    onMouseEnter={(e) => (e.currentTarget.style.background = iconHoverBg)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Avatar
                      src={user?.avatar}
                      alt={user?.name || 'User'}
                      className="w-8 h-8 ring-2 ring-transparent hover:ring-purple-500 transition-all duration-150"
                    />
                    <span
                      className="hidden sm:block text-sm font-medium max-w-[96px] truncate"
                      style={{ color: dropdownTextPrimary }}
                    >
                      {user?.name}
                    </span>
                  </button>

                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                      <div
                        className="absolute right-0 top-11 rounded-2xl shadow-2xl z-20 w-52 overflow-hidden py-1"
                        style={{
                          background: dropdownBg,
                          border: `1px solid ${dropdownBorder}`,
                          boxShadow: isLight
                            ? '0 8px 32px rgba(0,0,0,0.12)'
                            : '0 8px 32px rgba(0,0,0,0.5)',
                          animation: 'modalSlideUp 0.18s cubic-bezier(0.16,1,0.3,1) both',
                        }}
                      >
                        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${dropdownDivider}` }}>
                          <p className="font-semibold text-sm truncate" style={{ color: dropdownTextPrimary }}>
                            {user?.name}
                          </p>
                          <p className="text-xs truncate" style={{ color: dropdownTextMuted }}>
                            {user?.email}
                          </p>
                        </div>
                        {[
                          { label: 'Profile', href: '/settings/personal' },
                          { label: 'My Content', href: '/my-content' },
                          { label: 'Collections', href: '/collections' },
                        ].map((item) => (
                          <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2.5 text-sm transition-colors duration-100"
                            style={{ color: dropdownTextMuted }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = dropdownItemHover;
                              e.currentTarget.style.color = dropdownTextPrimary;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = dropdownTextMuted;
                            }}
                          >
                            {item.label}
                          </Link>
                        ))}
                        <div className="mt-1 pt-1" style={{ borderTop: `1px solid ${dropdownDivider}` }}>
                          <button
                            onClick={() => void handleLogout()}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors duration-100"
                          >
                            Sign out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="secondary" size="sm">
                    <span className="hidden sm:inline">Log in</span>
                    <span className="sm:hidden">In</span>
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">
                    <span className="hidden sm:inline">Sign up</span>
                    <span className="sm:hidden">Up</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile search bar — slides down */}
        {isMobileSearchOpen && (
          <div className="mt-2.5 md:hidden" style={{ animation: 'fadeInUp 0.18s ease both' }}>
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="Search videos, channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search size={15} />}
                className="pr-10"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors"
                style={{ color: iconColor }}
                onMouseEnter={(e) => (e.currentTarget.style.background = iconHoverBg)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Search size={15} />
              </button>
            </form>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
