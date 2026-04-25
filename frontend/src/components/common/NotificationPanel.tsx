import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellOff, Check, Trash2, X } from 'lucide-react';
import type { AppNotification } from '../../hooks/useNotifications';
import { formatTimeAgo } from '../../utils/formatter';

interface Props {
  notifications: AppNotification[];
  permission: NotificationPermission;
  onRequestPermission: () => Promise<NotificationPermission>;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClear: () => void;
  onClose: () => void;
  resolvedTheme: 'light' | 'dark';
}

const NotificationPanel: React.FC<Props> = ({
  notifications,
  permission,
  onRequestPermission,
  onMarkRead,
  onMarkAllRead,
  onClear,
  onClose,
  resolvedTheme,
}) => {
  const unread = notifications.filter((n) => !n.read).length;
  const isLight = resolvedTheme === 'light';

  const panelBg = isLight ? '#ffffff' : '#0f172a';
  const borderColor = isLight ? 'rgb(226 232 240)' : 'rgba(51,65,85,0.6)';
  const dividerColor = isLight ? 'rgb(241 245 249)' : 'rgb(30 41 59)';
  const hoverBg = isLight ? 'rgb(248 250 252)' : 'rgba(30,41,59,0.6)';
  const textPrimary = isLight ? 'rgb(15 23 42)' : 'rgb(248 250 252)';
  const textMuted = isLight ? 'rgb(100 116 139)' : 'rgb(148 163 184)';
  const textFaint = isLight ? 'rgb(148 163 184)' : 'rgb(71 85 105)';

  return (
    <div
      className="absolute right-0 top-12 w-80 sm:w-96 z-30 rounded-2xl overflow-hidden"
      style={{
        background: panelBg,
        border: `1px solid ${borderColor}`,
        boxShadow: isLight
          ? '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)'
          : '0 8px 32px rgba(0,0,0,0.5)',
        animation: 'modalSlideUp 0.22s cubic-bezier(0.16,1,0.3,1) both',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${dividerColor}` }}
      >
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-purple-500" />
          <h3 className="font-semibold text-sm" style={{ color: textPrimary }}>
            Notifications
          </h3>
          {unread > 0 && (
            <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full font-medium leading-none">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          {unread > 0 && (
            <button
              onClick={onMarkAllRead}
              title="Mark all as read"
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: textMuted }}
              onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <Check size={13} />
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={onClear}
              title="Clear all"
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: textMuted }}
              onMouseEnter={(e) => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = textMuted; }}
            >
              <Trash2 size={13} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Permission banner */}
      {permission === 'default' && (
        <div
          className="mx-3 mt-3 p-3 rounded-xl flex items-center gap-3"
          style={{
            background: 'rgba(139,92,246,0.08)',
            border: '1px solid rgba(139,92,246,0.2)',
          }}
        >
          <Bell size={15} className="text-purple-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-purple-400">Enable push notifications</p>
            <p className="text-xs mt-0.5" style={{ color: textMuted }}>
              Get notified about new videos from channels you follow
            </p>
          </div>
          <button
            onClick={() => void onRequestPermission()}
            className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0"
          >
            Allow
          </button>
        </div>
      )}

      {permission === 'denied' && (
        <div
          className="mx-3 mt-3 p-3 rounded-xl flex items-center gap-2"
          style={{
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.15)',
          }}
        >
          <BellOff size={13} className="text-red-400 shrink-0" />
          <p className="text-xs" style={{ color: textMuted }}>
            Push notifications blocked. Enable them in your browser settings.
          </p>
        </div>
      )}

      {/* Notification list */}
      <div className="max-h-80 overflow-y-auto" style={{ paddingBottom: '4px' }}>
        {notifications.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: isLight ? 'rgb(241 245 249)' : 'rgba(30,41,59,0.6)' }}
            >
              <Bell size={20} style={{ color: textFaint }} />
            </div>
            <p className="text-sm font-medium" style={{ color: textMuted }}>
              No notifications yet
            </p>
            <p className="text-xs mt-1" style={{ color: textFaint }}>
              Subscribe to channels to see their updates here
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <Link
              key={n.id}
              to={n.videoId ? `/video/${n.videoId}` : '#'}
              onClick={() => { onMarkRead(n.id); onClose(); }}
              className="flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer"
              style={{
                background: !n.read ? (isLight ? 'rgba(139,92,246,0.04)' : 'rgba(139,92,246,0.06)') : 'transparent',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
              onMouseLeave={(e) => (e.currentTarget.style.background = !n.read ? (isLight ? 'rgba(139,92,246,0.04)' : 'rgba(139,92,246,0.06)') : 'transparent')}
            >
              {n.thumbnail ? (
                <img
                  src={n.thumbnail}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center"
                  style={{ background: isLight ? 'rgb(226 232 240)' : 'rgb(30 41 59)' }}
                >
                  <Bell size={16} className="text-purple-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-semibold truncate"
                  style={{ color: !n.read ? (isLight ? 'rgb(15 23 42)' : 'rgb(248 250 252)') : textMuted }}
                >
                  {n.title}
                </p>
                <p className="text-xs mt-0.5 line-clamp-2" style={{ color: textMuted }}>
                  {n.body}
                </p>
                <p className="text-xs mt-1" style={{ color: textFaint }}>
                  {formatTimeAgo(new Date(n.timestamp).toISOString())}
                </p>
              </div>
              {!n.read && (
                <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0 mt-1.5" />
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
