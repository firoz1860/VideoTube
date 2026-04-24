import { Menu, Search, X, Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Logo from '../common/Logo';
import Button from '../common/Button';
import Input from '../common/Input';
import Avatar from '../common/Avatar';

interface NavbarProps {
  onMenuClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

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

  return (
    <nav
      className="sticky top-0 z-20 border-b border-slate-800/80"
      style={{
        background: 'rgba(15, 23, 41, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="px-3 sm:px-4 py-2.5">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Hamburger — mobile only */}
          <button
            type="button"
            className="md:hidden p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors duration-150"
            onClick={onMenuClick}
            aria-label="Toggle menu"
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
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors duration-150"
                aria-label="Search"
              >
                <Search size={15} />
              </button>
            </form>
          </div>

          {/* Mobile search toggle */}
          <button
            type="button"
            className="md:hidden p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors duration-150"
            onClick={() => setIsMobileSearchOpen((v) => !v)}
            aria-label="Toggle search"
          >
            {isMobileSearchOpen ? <X size={18} /> : <Search size={18} />}
          </button>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* Notification bell — tablet+ */}
                <button className="hidden sm:flex p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors duration-150" title="Notifications">
                  <Bell size={18} />
                </button>

                {/* User avatar + dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu((v) => !v)}
                    className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-800 transition-colors duration-150"
                  >
                    <Avatar
                      src={user?.avatar}
                      alt={user?.name || 'User'}
                      className="w-8 h-8 ring-2 ring-transparent hover:ring-purple-500 transition-all duration-150"
                    />
                    <span className="hidden sm:block text-sm font-medium text-slate-200 max-w-[96px] truncate">
                      {user?.name}
                    </span>
                  </button>

                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                      <div className="absolute right-0 top-11 bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl z-20 w-52 overflow-hidden py-1">
                        <div className="px-4 py-3 border-b border-slate-800">
                          <p className="font-semibold text-sm text-white truncate">{user?.name}</p>
                          <p className="text-xs text-slate-400 truncate">{user?.email}</p>
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
                            className="block px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors duration-100"
                          >
                            {item.label}
                          </Link>
                        ))}
                        <div className="border-t border-slate-800 mt-1 pt-1">
                          <button
                            onClick={() => void handleLogout()}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/20 transition-colors duration-100"
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
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
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
