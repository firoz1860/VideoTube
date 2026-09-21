import { Home, ThumbsUp, Clock, Video, FolderHeart, Users, HelpCircle, Settings, UserCircle2, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useData } from '../../context/DataContext';
import Avatar from '../common/Avatar';

interface SidebarProps {
  isMobileOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  icon: React.ReactNode;
  text: string;
  link: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  const { subscribedChannels } = useData();

  const primaryItems: MenuItem[] = [
    { icon: <Home size={20} />, text: 'Home', link: '/' },
  ];

  // Grouped under a "You" header, mirroring YouTube's library section.
  const youItems: MenuItem[] = [
    { icon: <Clock size={20} />,       text: 'History',      link: '/history' },
    { icon: <ThumbsUp size={20} />,    text: 'Liked Videos', link: '/liked' },
    { icon: <Video size={20} />,       text: 'My Content',   link: '/my-content' },
    { icon: <FolderHeart size={20} />, text: 'Collections',  link: '/collections' },
    { icon: <Users size={20} />,       text: 'Subscribers',  link: '/subscribers' },
  ];

  const bottomItems: MenuItem[] = [
    { icon: <UserCircle2 size={20} />, text: 'Profile',  link: '/profile' },
    { icon: <HelpCircle size={20} />,  text: 'Support',  link: '/support' },
    { icon: <Settings size={20} />,    text: 'Settings', link: '/settings/personal' },
  ];

  const isActive = (link: string) =>
    link === '/' ? location.pathname === '/' : location.pathname.startsWith(link);

  const showLabel = isMobileOpen || isExpanded;

  const renderItem = (item: MenuItem) => (
    <Link to={item.link} key={item.link} onClick={onClose}>
      <div
        className={`sidebar-item ${isActive(item.link) ? 'bg-purple-600 !text-white' : ''}`}
        title={!showLabel ? item.text : undefined}
      >
        <span className="shrink-0">{item.icon}</span>
        <span
          className="text-sm font-medium overflow-hidden whitespace-nowrap transition-all duration-200"
          style={{ width: showLabel ? '120px' : '0px', opacity: showLabel ? 1 : 0 }}
        >
          {item.text}
        </span>
      </div>
    </Link>
  );

  const sectionHeader = (label: string) =>
    showLabel ? (
      <p className="px-3 pt-3 pb-1 text-xs font-semibold" style={{ color: 'rgb(var(--app-muted))' }}>
        {label}
      </p>
    ) : (
      <div className="h-px bg-slate-800/60 mx-2 my-2" />
    );

  return (
    <>
      {/* Mobile overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity duration-300"
        style={{ opacity: isMobileOpen ? 1 : 0, pointerEvents: isMobileOpen ? 'auto' : 'none' }}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen pt-[60px] bg-[#0F1729] border-r border-slate-800/60
          overflow-y-auto overflow-x-hidden
          md:sticky md:top-[60px] md:h-[calc(100vh-60px)] md:pt-0 md:translate-x-0 md:z-10
          transition-all duration-300
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}
          ${isExpanded ? 'md:w-56' : 'md:w-[62px]'}
        `}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Mobile close */}
        <div className="md:hidden flex justify-between items-center px-3 py-3 border-b border-slate-800">
          <span className="text-sm font-semibold text-slate-300">Menu</span>
          <button
            type="button"
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col justify-between min-h-full py-3 px-2">
          <div className="space-y-0.5">
            {primaryItems.map(renderItem)}

            {sectionHeader('You')}
            {youItems.map(renderItem)}

            {/* Subscriptions — real followed channels, shown when expanded */}
            {showLabel && subscribedChannels.length > 0 && (
              <>
                {sectionHeader('Subscriptions')}
                {subscribedChannels.slice(0, 7).map((channel) => (
                  <Link to={`/channel/${channel.id}`} key={channel.id} onClick={onClose}>
                    <div
                      className={`sidebar-item ${location.pathname === `/channel/${channel.id}` ? 'bg-purple-600 !text-white' : ''}`}
                    >
                      <Avatar src={channel.avatar} alt={channel.name} size="sm" className="shrink-0" />
                      <span className="text-sm font-medium overflow-hidden whitespace-nowrap truncate">
                        {channel.name}
                      </span>
                    </div>
                  </Link>
                ))}
              </>
            )}
          </div>

          <div className="space-y-0.5 pb-4 pt-2">
            <div className="h-px bg-slate-800/60 mx-2 my-2" />
            {bottomItems.map(renderItem)}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
