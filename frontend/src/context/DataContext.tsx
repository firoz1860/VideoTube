import React, {
  createContext, useCallback, useContext, useEffect,
  useMemo, useRef, useState,
} from 'react';
import { useAuth } from './AuthContext';
import { api } from '../lib/api';
import { mapCollection, mapUser, mapVideo } from '../lib/mappers';
import type { Collection, User, Video } from '../types';

interface DataContextType {
  isLoading: boolean;
  videos: Video[];
  users: User[];
  likedVideos: string[];
  likedComments: string[];
  watchHistory: string[];
  subscriptions: string[];
  collections: Collection[];
  subscribedChannels: User[];
  refreshVideos: () => Promise<void>;
  addVideo: (formData: FormData) => Promise<Video>;
  updateVideo: (id: string, updates: { title?: string; description?: string; thumbnail?: string | File }) => Promise<Video>;
  deleteVideo: (id: string) => Promise<void>;
  toggleLike: (videoId: string) => Promise<void>;
  toggleCommentLike: (commentId: string) => Promise<{ likeCount: number; liked: boolean }>;
  addToHistory: (videoId: string) => Promise<void>;
  removeFromHistory: (videoId: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  toggleSubscription: (channelId: string) => Promise<void>;
  addCollection: (collection: Omit<Collection, 'id'>) => Promise<void>;
  updateCollection: (id: string, updates: Partial<Collection>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  addVideoToCollection: (collectionId: string, videoId: string) => Promise<void>;
  removeVideoFromCollection: (collectionId: string, videoId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const mergeUniqueVideos = (current: Video[], incoming: Video[]): Video[] => {
  const map = new Map<string, Video>();
  current.forEach((v) => { if (v.id) map.set(v.id, v); });
  incoming.forEach((v) => { if (v.id) map.set(v.id, v); });
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  const [isLoading, setIsLoading]           = useState(true);
  const [videos, setVideos]                 = useState<Video[]>([]);
  const [likedVideos, setLikedVideos]       = useState<string[]>([]);
  const [likedComments, setLikedComments]   = useState<string[]>([]);
  const [watchHistory, setWatchHistory]     = useState<string[]>([]);
  const [subscriptions, setSubscriptions]   = useState<string[]>([]);
  const [collections, setCollections]       = useState<Collection[]>([]);
  const [subscribedChannels, setSubscribedChannels] = useState<User[]>([]);

  // Stable user id — changing name/avatar must NOT re-trigger private data load
  const userId = user?.id ?? null;

  // ── Derived users map (all known channels) ──────────────────────────────────
  const users = useMemo(() => {
    const map = new Map<string, User>();
    videos.forEach((v) => map.set(v.channel.id, v.channel));
    subscribedChannels.forEach((c) => map.set(c.id, c));
    return Array.from(map.values());
  }, [videos, subscribedChannels]);

  // Keep a ref to the latest users so toggleSubscription never has a stale closure
  const usersRef = useRef<User[]>(users);
  useEffect(() => { usersRef.current = users; }, [users]);

  // Refs mirror the latest toggle state so optimistic handlers can read the
  // current value at click-time (for instant UI + accurate rollback) without
  // adding these arrays to every callback's dependency list.
  const likedVideosRef = useRef<string[]>(likedVideos);
  useEffect(() => { likedVideosRef.current = likedVideos; }, [likedVideos]);
  const subscriptionsRef = useRef<string[]>(subscriptions);
  useEffect(() => { subscriptionsRef.current = subscriptions; }, [subscriptions]);
  const likedCommentsRef = useRef<string[]>(likedComments);
  useEffect(() => { likedCommentsRef.current = likedComments; }, [likedComments]);

  // ── refreshVideos — merges so private data is not wiped ────────────────────
  const refreshVideos = useCallback(async () => {
    const response = await api.getVideos();
    const fetched = (response.items || []).map(mapVideo);
    setVideos((current) => mergeUniqueVideos(current, fetched));
  }, []);

  // ── loadPrivateData — only depends on isAuthenticated + userId ────────────
  const loadPrivateData = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      setLikedVideos([]);
      setWatchHistory([]);
      setSubscriptions([]);
      setCollections([]);
      setSubscribedChannels([]);
      return;
    }

    try {
      const [likedRes, historyRes, channelsRes, playlistsRes] = await Promise.allSettled([
        api.getLikedVideos(),
        api.getWatchHistory(),
        api.getSubscribedChannels(userId),
        api.getUserPlaylists(userId),
      ]);

      const liked     = likedRes.status     === 'fulfilled' ? likedRes.value     : [];
      const history   = historyRes.status   === 'fulfilled' ? historyRes.value   : [];
      const channels  = channelsRes.status  === 'fulfilled' ? channelsRes.value  : [];
      const playlists = playlistsRes.status === 'fulfilled' ? playlistsRes.value : [];

      const likedVideos   = liked.map(mapVideo);
      const historyVideos = history.map(mapVideo);
      const playlistVideos = playlists
        .flatMap((p) => Array.isArray((p as { videos?: unknown[] }).videos)
          ? (p as { videos: unknown[] }).videos : [])
        .map(mapVideo);

      const nextChannels = channels.map(mapUser);

      setVideos((cur) => mergeUniqueVideos(cur, [...likedVideos, ...historyVideos, ...playlistVideos]));
      setLikedVideos(likedVideos.map((v) => v.id));
      setWatchHistory(historyVideos.map((v) => v.id));
      setSubscriptions(nextChannels.map((c) => c.id));
      setCollections(playlists.map(mapCollection));
      setSubscribedChannels(nextChannels);
    } catch {
      setLikedVideos([]);
      setWatchHistory([]);
      setSubscriptions([]);
      setCollections([]);
      setSubscribedChannels([]);
    }
  }, [isAuthenticated, userId]); // userId is a primitive — profile updates won't re-trigger

  // ── Bootstrap ────────────────────────────────────────────────────────────────
  // Only the public video feed gates the first paint — that is all a visitor
  // needs to start browsing. Private data (likes, history, subscriptions,
  // playlists) then hydrates in the background so it never blocks rendering.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setIsLoading(true);
      try {
        await refreshVideos();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
      void loadPrivateData();
    };
    void run();
    return () => { cancelled = true; };
  }, [refreshVideos, loadPrivateData]);

  // ── Sync channel info when user profile changes (name, avatar, etc.) ────────
  useEffect(() => {
    if (!user) return;
    setVideos((cur) =>
      cur.map((v) =>
        v.channel.id === user.id
          ? { ...v, channel: { ...v.channel, name: user.name, username: user.username, avatar: user.avatar, coverImage: user.coverImage || v.channel.coverImage, subscribers: user.subscribers ?? v.channel.subscribers } }
          : v
      )
    );
    setSubscribedChannels((cur) =>
      cur.map((c) =>
        c.id === user.id
          ? { ...c, name: user.name, username: user.username, avatar: user.avatar, coverImage: user.coverImage || c.coverImage, email: user.email || c.email, subscribers: user.subscribers ?? c.subscribers }
          : c
      )
    );
  }, [user]);

  // ── updateVideoChannel (stable via useCallback) ───────────────────────────
  const updateVideoChannel = useCallback((channelId: string, subscriberCount: number) => {
    setVideos((cur) =>
      cur.map((v) => v.channel.id === channelId ? { ...v, channel: { ...v.channel, subscribers: subscriberCount } } : v)
    );
    setSubscribedChannels((cur) =>
      cur.map((c) => c.id === channelId ? { ...c, subscribers: subscriberCount } : c)
    );
  }, []);

  // Adjust a channel's subscriber count by a relative delta (optimistic +1/-1
  // before the server confirms the absolute value).
  const adjustChannelSubscribers = useCallback((channelId: string, delta: number) => {
    setVideos((cur) =>
      cur.map((v) => v.channel.id === channelId
        ? { ...v, channel: { ...v.channel, subscribers: Math.max(0, (v.channel.subscribers ?? 0) + delta) } }
        : v)
    );
    setSubscribedChannels((cur) =>
      cur.map((c) => c.id === channelId
        ? { ...c, subscribers: Math.max(0, (c.subscribers ?? 0) + delta) }
        : c)
    );
  }, []);

  // ── Video CRUD ────────────────────────────────────────────────────────────────
  const addVideo = useCallback(async (formData: FormData) => {
    const response = await api.createVideo(formData);
    const next = mapVideo(response);
    setVideos((cur) => [next, ...cur.filter((v) => v.id !== next.id)]);
    await refreshVideos().catch(() => undefined);
    return next;
  }, [refreshVideos]);

  const updateVideo = useCallback(async (
    id: string,
    updates: { title?: string; description?: string; thumbnail?: string | File },
  ) => {
    const payload = updates.thumbnail instanceof File
      ? (() => {
          const fd = new FormData();
          if (updates.title)       fd.append('title', updates.title);
          if (updates.description) fd.append('description', updates.description);
          fd.append('thumbnail', updates.thumbnail as File);
          return fd;
        })()
      : ({
          ...(updates.title       !== undefined && { title: updates.title }),
          ...(updates.description !== undefined && { description: updates.description }),
        } as Record<string, unknown>);

    const response = await api.updateVideo(id, payload);
    const next = mapVideo(response);
    setVideos((cur) => cur.map((v) => v.id === id ? next : v));
    return next;
  }, []);

  const deleteVideo = useCallback(async (id: string) => {
    await api.deleteVideo(id);
    setVideos((cur)         => cur.filter((v) => v.id !== id));
    setLikedVideos((cur)    => cur.filter((x) => x !== id));
    setWatchHistory((cur)   => cur.filter((x) => x !== id));
  }, []);

  // ── Likes ─────────────────────────────────────────────────────────────────────
  const toggleLike = useCallback(async (videoId: string) => {
    if (!isAuthenticated) return;

    const wasLiked = likedVideosRef.current.includes(videoId);

    // Optimistic: flip the like state and count immediately.
    setLikedVideos((cur) =>
      wasLiked ? cur.filter((id) => id !== videoId) : Array.from(new Set([videoId, ...cur]))
    );
    setVideos((cur) =>
      cur.map((v) => v.id === videoId
        ? { ...v, likeCount: Math.max(0, (v.likeCount ?? 0) + (wasLiked ? -1 : 1)) }
        : v)
    );

    try {
      const res = await api.toggleVideoLike(videoId);
      // Reconcile with the authoritative server values.
      setLikedVideos((cur) =>
        res.liked ? Array.from(new Set([videoId, ...cur])) : cur.filter((id) => id !== videoId)
      );
      setVideos((cur) =>
        cur.map((v) => v.id === videoId ? { ...v, likeCount: res.likeCount } : v)
      );
    } catch {
      // Roll back the optimistic change on failure.
      setLikedVideos((cur) =>
        wasLiked ? Array.from(new Set([videoId, ...cur])) : cur.filter((id) => id !== videoId)
      );
      setVideos((cur) =>
        cur.map((v) => v.id === videoId
          ? { ...v, likeCount: Math.max(0, (v.likeCount ?? 0) + (wasLiked ? 1 : -1)) }
          : v)
      );
    }
  }, [isAuthenticated]);

  const toggleCommentLike = useCallback(async (commentId: string) => {
    if (!isAuthenticated) return { likeCount: 0, liked: false };

    const wasLiked = likedCommentsRef.current.includes(commentId);

    // Optimistic: flip the button state immediately; caller handles the count.
    setLikedComments((cur) =>
      wasLiked ? cur.filter((id) => id !== commentId) : Array.from(new Set([commentId, ...cur]))
    );

    try {
      const res = await api.toggleCommentLike(commentId);
      setLikedComments((cur) =>
        res.liked ? Array.from(new Set([commentId, ...cur])) : cur.filter((id) => id !== commentId)
      );
      return res;
    } catch (error) {
      // Roll back, then re-throw so the caller can restore its own count.
      setLikedComments((cur) =>
        wasLiked ? Array.from(new Set([commentId, ...cur])) : cur.filter((id) => id !== commentId)
      );
      throw error;
    }
  }, [isAuthenticated]);

  // ── History ───────────────────────────────────────────────────────────────────
  const addToHistory = useCallback(async (videoId: string) => {
    if (!isAuthenticated) return;
    // Optimistic — surface in history instantly; ignore failures silently.
    setWatchHistory((cur) => [videoId, ...cur.filter((id) => id !== videoId)]);
    try {
      await api.addToWatchHistory(videoId);
    } catch {
      /* non-critical: history will re-sync on next load */
    }
  }, [isAuthenticated]);

  const removeFromHistory = useCallback(async (videoId: string) => {
    if (!isAuthenticated) return;
    await api.removeFromWatchHistory(videoId);
    setWatchHistory((cur) => cur.filter((id) => id !== videoId));
  }, [isAuthenticated]);

  const clearHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    await api.clearWatchHistory();
    setWatchHistory([]);
  }, [isAuthenticated]);

  // ── Subscriptions ─────────────────────────────────────────────────────────────
  const toggleSubscription = useCallback(async (channelId: string) => {
    if (!isAuthenticated) return;

    const wasSubscribed = subscriptionsRef.current.includes(channelId);
    const delta = wasSubscribed ? -1 : 1;
    const existing = usersRef.current.find((c) => c.id === channelId);

    // ── Optimistic: flip the button + adjust counts immediately ──────────────
    setSubscriptions((cur) =>
      wasSubscribed ? cur.filter((id) => id !== channelId) : Array.from(new Set([channelId, ...cur]))
    );
    adjustChannelSubscribers(channelId, delta);
    if (wasSubscribed) {
      setSubscribedChannels((cur) => cur.filter((c) => c.id !== channelId));
    } else if (existing) {
      setSubscribedChannels((cur) => [
        { ...existing, subscribers: Math.max(0, (existing.subscribers ?? 0) + 1) },
        ...cur.filter((c) => c.id !== channelId),
      ]);
    }

    try {
      const res = await api.toggleSubscription(channelId);

      // Reconcile with authoritative server state.
      setSubscriptions((cur) =>
        res.subscribed ? Array.from(new Set([channelId, ...cur])) : cur.filter((id) => id !== channelId)
      );
      updateVideoChannel(channelId, res.subscriberCount);

      if (res.subscribed) {
        if (existing) {
          setSubscribedChannels((cur) => [
            { ...existing, subscribers: res.subscriberCount },
            ...cur.filter((c) => c.id !== channelId),
          ]);
        } else {
          // Channel wasn't cached — fetch its full record in the background.
          const channelData = await api.getChannelById(channelId);
          setSubscribedChannels((cur) =>
            cur.some((c) => c.id === channelId) ? cur : [mapUser(channelData), ...cur]
          );
        }
      } else {
        setSubscribedChannels((cur) => cur.filter((c) => c.id !== channelId));
      }
    } catch {
      // Roll back the optimistic changes on failure.
      setSubscriptions((cur) =>
        wasSubscribed ? Array.from(new Set([channelId, ...cur])) : cur.filter((id) => id !== channelId)
      );
      adjustChannelSubscribers(channelId, -delta);
      if (wasSubscribed && existing) {
        setSubscribedChannels((cur) =>
          cur.some((c) => c.id === channelId) ? cur : [existing, ...cur]
        );
      } else if (!wasSubscribed) {
        setSubscribedChannels((cur) => cur.filter((c) => c.id !== channelId));
      }
    }
  }, [isAuthenticated, updateVideoChannel, adjustChannelSubscribers]);

  // ── Collections ───────────────────────────────────────────────────────────────
  const addCollection = useCallback(async (collection: Omit<Collection, 'id'>) => {
    const res = await api.createPlaylist({ name: collection.name, description: collection.description });
    setCollections((cur) => [mapCollection(res), ...cur]);
  }, []);

  const updateCollection = useCallback(async (id: string, updates: Partial<Collection>) => {
    const res = await api.updatePlaylist(id, { name: updates.name, description: updates.description });
    const next = mapCollection(res);
    setCollections((cur) => cur.map((c) => c.id === id ? next : c));
  }, []);

  const deleteCollection = useCallback(async (id: string) => {
    await api.deletePlaylist(id);
    setCollections((cur) => cur.filter((c) => c.id !== id));
  }, []);

  const addVideoToCollection = useCallback(async (collectionId: string, videoId: string) => {
    // Optimistic add — the checkmark/count flips instantly.
    setCollections((cur) =>
      cur.map((c) => c.id === collectionId && !c.videos.includes(videoId)
        ? { ...c, videos: [videoId, ...c.videos] }
        : c)
    );
    try {
      await api.addVideoToPlaylist(collectionId, videoId);
    } catch (error) {
      setCollections((cur) =>
        cur.map((c) => c.id === collectionId
          ? { ...c, videos: c.videos.filter((id) => id !== videoId) }
          : c)
      );
      throw error;
    }
  }, []);

  const removeVideoFromCollection = useCallback(async (collectionId: string, videoId: string) => {
    // Snapshot for rollback, then remove optimistically.
    const wasPresent = collections.find((c) => c.id === collectionId)?.videos.includes(videoId) ?? false;
    setCollections((cur) =>
      cur.map((c) => c.id === collectionId
        ? { ...c, videos: c.videos.filter((id) => id !== videoId) }
        : c)
    );
    try {
      await api.removeVideoFromPlaylist(collectionId, videoId);
    } catch (error) {
      if (wasPresent) {
        setCollections((cur) =>
          cur.map((c) => c.id === collectionId && !c.videos.includes(videoId)
            ? { ...c, videos: [videoId, ...c.videos] }
            : c)
        );
      }
      throw error;
    }
  }, [collections]);

  return (
    <DataContext.Provider value={{
      isLoading, videos, users, likedVideos, likedComments, watchHistory,
      subscriptions, collections, subscribedChannels,
      refreshVideos, addVideo, updateVideo, deleteVideo,
      toggleLike, toggleCommentLike,
      addToHistory, removeFromHistory, clearHistory,
      toggleSubscription,
      addCollection, updateCollection, deleteCollection,
      addVideoToCollection, removeVideoFromCollection,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
