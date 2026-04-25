import { useState, useEffect, useCallback } from 'react';
import type { Video } from '../types';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  thumbnail?: string;
  videoId?: string;
  timestamp: number;
  read: boolean;
}

const STORAGE_KEY = 'vt_notifications';
const LAST_SEEN_KEY = 'vt_last_notification_check';
const MAX_STORED = 50;

const loadStored = (): AppNotification[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

const persist = (items: AppNotification[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_STORED)));
};

export const useNotifications = (
  videos: Video[],
  subscriptions: string[],
  isAuthenticated: boolean
) => {
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [notifications, setNotifications] = useState<AppNotification[]>(loadStored);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!isAuthenticated || !subscriptions.length || !videos.length) return;

    const rawLastCheck = localStorage.getItem(LAST_SEEN_KEY);
    const now = Date.now();

    // First visit — just set the timestamp, skip generating notifications
    if (!rawLastCheck) {
      localStorage.setItem(LAST_SEEN_KEY, String(now));
      return;
    }

    const lastCheck = Number(rawLastCheck);
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const fresh: AppNotification[] = [];
    videos
      .filter((v) => {
        const ts = new Date(v.timestamp).getTime();
        return (
          subscriptions.includes(v.channel?.id ?? '') &&
          ts > lastCheck &&
          ts > oneWeekAgo
        );
      })
      .slice(0, 10)
      .forEach((v) => {
        fresh.push({
          id: `vid-${v.id}`,
          title: v.channel.name,
          body: `New video: ${v.title}`,
          thumbnail: v.thumbnail || v.channel.avatar,
          videoId: v.id,
          timestamp: new Date(v.timestamp).getTime(),
          read: false,
        });
      });

    localStorage.setItem(LAST_SEEN_KEY, String(now));

    if (fresh.length === 0) return;

    setNotifications((prev) => {
      const existingIds = new Set(prev.map((n) => n.id));
      const newOnes = fresh.filter((n) => !existingIds.has(n.id));
      if (newOnes.length === 0) return prev;

      const merged = [...newOnes, ...prev].slice(0, MAX_STORED);
      persist(merged);

      if (permission === 'granted' && typeof Notification !== 'undefined') {
        newOnes.slice(0, 3).forEach((n) => {
          try {
            new Notification(n.title, { body: n.body, icon: n.thumbnail, tag: n.id });
          } catch {
            // browser may block silently
          }
        });
      }

      return merged;
    });
  }, [videos, subscriptions, isAuthenticated, permission]);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (typeof Notification === 'undefined') return 'denied';
    if (Notification.permission !== 'default') {
      setPermission(Notification.permission);
      return Notification.permission;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      persist(updated);
      return updated;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      persist(updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { permission, notifications, unreadCount, requestPermission, markRead, markAllRead, clearAll };
};
