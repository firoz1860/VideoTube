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
  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      try {
        await refreshVideos();
        await loadPrivateData();
      } finally {
        setIsLoading(false);
      }
    };
    void run();
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
    const res = await api.toggleVideoLike(videoId);
    setLikedVideos((cur) =>
      res.liked ? Array.from(new Set([videoId, ...cur])) : cur.filter((id) => id !== videoId)
    );
    setVideos((cur) =>
      cur.map((v) => v.id === videoId ? { ...v, likeCount: res.likeCount } : v)
    );
  }, [isAuthenticated]);

  const toggleCommentLike = useCallback(async (commentId: string) => {
    if (!isAuthenticated) return { likeCount: 0, liked: false };
    const res = await api.toggleCommentLike(commentId);
    setLikedComments((cur) =>
      res.liked ? Array.from(new Set([commentId, ...cur])) : cur.filter((id) => id !== commentId)
    );
    return res;
  }, [isAuthenticated]);

  // ── History ───────────────────────────────────────────────────────────────────
  const addToHistory = useCallback(async (videoId: string) => {
    if (!isAuthenticated) return;
    await api.addToWatchHistory(videoId);
    setWatchHistory((cur) => [videoId, ...cur.filter((id) => id !== videoId)]);
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

    const res = await api.toggleSubscription(channelId);

    setSubscriptions((cur) =>
      res.subscribed
        ? Array.from(new Set([channelId, ...cur]))
        : cur.filter((id) => id !== channelId)
    );

    updateVideoChannel(channelId, res.subscriberCount);

    if (res.subscribed) {
      // Use ref so we always read the latest users without a stale closure
      const existing = usersRef.current.find((c) => c.id === channelId);
      if (existing) {
        setSubscribedChannels((cur) => [
          { ...existing, subscribers: res.subscriberCount },
          ...cur.filter((c) => c.id !== channelId),
        ]);
      } else {
        const channelData = await api.getChannelById(channelId);
        setSubscribedChannels((cur) => [mapUser(channelData), ...cur]);
      }
    } else {
      setSubscribedChannels((cur) => cur.filter((c) => c.id !== channelId));
    }
  }, [isAuthenticated, updateVideoChannel]); // no longer depends on users

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
    await api.addVideoToPlaylist(collectionId, videoId);
    setCollections((cur) =>
      cur.map((c) => c.id === collectionId && !c.videos.includes(videoId)
        ? { ...c, videos: [videoId, ...c.videos] }
        : c)
    );
  }, []);

  const removeVideoFromCollection = useCallback(async (collectionId: string, videoId: string) => {
    await api.removeVideoFromPlaylist(collectionId, videoId);
    setCollections((cur) =>
      cur.map((c) => c.id === collectionId
        ? { ...c, videos: c.videos.filter((id) => id !== videoId) }
        : c)
    );
  }, []);

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
