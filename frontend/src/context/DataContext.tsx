import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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

const mergeUniqueVideos = (currentVideos: Video[], incomingVideos: Video[]) => {
  const videoMap = new Map<string, Video>();

  currentVideos.forEach((video) => {
    if (video.id) {
      videoMap.set(video.id, video);
    }
  });

  incomingVideos.forEach((video) => {
    if (video.id) {
      videoMap.set(video.id, video);
    }
  });

  return Array.from(videoMap.values()).sort(
    (first, second) => new Date(second.timestamp).getTime() - new Date(first.timestamp).getTime()
  );
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [videos, setVideos] = useState<Video[]>([]);
  const [likedVideos, setLikedVideos] = useState<string[]>([]);
  const [likedComments, setLikedComments] = useState<string[]>([]);
  const [watchHistory, setWatchHistory] = useState<string[]>([]);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [subscribedChannels, setSubscribedChannels] = useState<User[]>([]);

  const refreshVideos = useCallback(async () => {
    const response = await api.getVideos();
    setVideos((response.items || []).map(mapVideo));
  }, []);

  const loadPrivateData = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setLikedVideos([]);
      setWatchHistory([]);
      setSubscriptions([]);
      setCollections([]);
      setSubscribedChannels([]);
      return;
    }

    try {
      const [likedResult, historyResult, channelListResult, playlistListResult] = await Promise.allSettled([
        api.getLikedVideos(),
        api.getWatchHistory(),
        api.getSubscribedChannels(user.id),
        api.getUserPlaylists(user.id),
      ]);

      const liked = likedResult.status === 'fulfilled' ? likedResult.value : [];
      const history = historyResult.status === 'fulfilled' ? historyResult.value : [];
      const channelList = channelListResult.status === 'fulfilled' ? channelListResult.value : [];
      const playlistList = playlistListResult.status === 'fulfilled' ? playlistListResult.value : [];

      const likedVideoList = liked.map(mapVideo);
      const historyVideoList = history.map(mapVideo);
      const playlistVideoList = playlistList
        .flatMap((playlist) => (Array.isArray((playlist as { videos?: unknown[] }).videos) ? (playlist as { videos: unknown[] }).videos : []))
        .map(mapVideo);
      const nextChannels = channelList.map(mapUser);

      setVideos((currentVideos) => mergeUniqueVideos(currentVideos, [...likedVideoList, ...historyVideoList, ...playlistVideoList]));
      setLikedVideos(likedVideoList.map((video) => video.id));
      setWatchHistory(historyVideoList.map((video) => video.id));
      setSubscriptions(nextChannels.map((channel) => channel.id));
      setCollections(playlistList.map(mapCollection));
      setSubscribedChannels(nextChannels);
    } catch {
      setLikedVideos([]);
      setWatchHistory([]);
      setSubscriptions([]);
      setCollections([]);
      setSubscribedChannels([]);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    const bootstrap = async () => {
      setIsLoading(true);
      try {
        await refreshVideos();
        await loadPrivateData();
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrap();
  }, [refreshVideos, loadPrivateData]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setVideos((currentVideos) =>
      currentVideos.map((video) =>
        video.channel.id === user.id
          ? {
              ...video,
              channel: {
                ...video.channel,
                name: user.name,
                username: user.username,
                avatar: user.avatar,
                coverImage: user.coverImage || video.channel.coverImage,
                subscribers: user.subscribers ?? video.channel.subscribers,
              },
            }
          : video
      )
    );

    setSubscribedChannels((currentChannels) =>
      currentChannels.map((channel) =>
        channel.id === user.id
          ? {
              ...channel,
              name: user.name,
              username: user.username,
              avatar: user.avatar,
              coverImage: user.coverImage || channel.coverImage,
              email: user.email || channel.email,
              subscribers: user.subscribers ?? channel.subscribers,
            }
          : channel
      )
    );
  }, [user]);

  const users = useMemo(() => {
    const channels = new Map<string, User>();

    videos.forEach((video) => {
      channels.set(video.channel.id, video.channel);
    });

    subscribedChannels.forEach((channel) => {
      channels.set(channel.id, channel);
    });

    return Array.from(channels.values());
  }, [videos, subscribedChannels]);

  const updateVideoChannel = (channelId: string, subscriberCount: number) => {
    setVideos((currentVideos) =>
      currentVideos.map((video) =>
        video.channel.id === channelId
          ? { ...video, channel: { ...video.channel, subscribers: subscriberCount } }
          : video
      )
    );

    setSubscribedChannels((currentChannels) =>
      currentChannels.map((channel) =>
        channel.id === channelId ? { ...channel, subscribers: subscriberCount } : channel
      )
    );
  };

  const addVideo = useCallback(async (formData: FormData) => {
    const response = await api.createVideo(formData);
    const nextVideo = mapVideo(response);
    setVideos((currentVideos) => [nextVideo, ...currentVideos.filter((video) => video.id !== nextVideo.id)]);
    await refreshVideos().catch(() => undefined);
    return nextVideo;
  }, [refreshVideos]);

  const updateVideo = useCallback(async (id: string, updates: { title?: string; description?: string; thumbnail?: string | File }) => {
    const payload = updates.thumbnail instanceof File ? new FormData() : ({} as Record<string, unknown>);

    if (payload instanceof FormData) {
      if (updates.title) payload.append('title', updates.title);
      if (updates.description) payload.append('description', updates.description);
      payload.append('thumbnail', updates.thumbnail);
    } else {
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.description !== undefined) payload.description = updates.description;
    }

    const response = await api.updateVideo(id, payload);
    const nextVideo = mapVideo(response);
    setVideos((currentVideos) => currentVideos.map((video) => (video.id === id ? nextVideo : video)));
    return nextVideo;
  }, []);

  const deleteVideo = useCallback(async (id: string) => {
    await api.deleteVideo(id);
    setVideos((currentVideos) => currentVideos.filter((video) => video.id !== id));
    setLikedVideos((current) => current.filter((videoId) => videoId !== id));
    setWatchHistory((current) => current.filter((videoId) => videoId !== id));
  }, []);

  const toggleLike = useCallback(async (videoId: string) => {
    if (!isAuthenticated) return;

    const response = await api.toggleVideoLike(videoId);
    setLikedVideos((current) =>
      response.liked ? Array.from(new Set([videoId, ...current])) : current.filter((id) => id !== videoId)
    );
    setVideos((currentVideos) =>
      currentVideos.map((video) => (video.id === videoId ? { ...video, likeCount: response.likeCount } : video))
    );
  }, [isAuthenticated]);

  const addToHistory = useCallback(async (videoId: string) => {
    if (!isAuthenticated) return;
    await api.addToWatchHistory(videoId);
    setWatchHistory((current) => [videoId, ...current.filter((id) => id !== videoId)]);
  }, [isAuthenticated]);

  const removeFromHistory = useCallback(async (videoId: string) => {
    if (!isAuthenticated) return;
    await api.removeFromWatchHistory(videoId);
    setWatchHistory((current) => current.filter((id) => id !== videoId));
  }, [isAuthenticated]);

  const clearHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    await api.clearWatchHistory();
    setWatchHistory([]);
  }, [isAuthenticated]);

  const toggleSubscription = useCallback(async (channelId: string) => {
    if (!isAuthenticated) return;

    const response = await api.toggleSubscription(channelId);

    setSubscriptions((current) =>
      response.subscribed ? Array.from(new Set([channelId, ...current])) : current.filter((id) => id !== channelId)
    );

    updateVideoChannel(channelId, response.subscriberCount);

    if (response.subscribed) {
      const existingChannel = users.find((channel) => channel.id === channelId);
      if (existingChannel) {
        setSubscribedChannels((current) => {
          const withoutChannel = current.filter((channel) => channel.id !== channelId);
          return [{ ...existingChannel, subscribers: response.subscriberCount }, ...withoutChannel];
        });
      } else {
        const channelResponse = await api.getChannelById(channelId);
        setSubscribedChannels((current) => [mapUser(channelResponse), ...current]);
      }
    } else {
      setSubscribedChannels((current) => current.filter((channel) => channel.id !== channelId));
    }
  }, [isAuthenticated, users]);

  const addCollection = useCallback(async (collection: Omit<Collection, 'id'>) => {
    const response = await api.createPlaylist({ name: collection.name, description: collection.description });
    setCollections((current) => [mapCollection(response), ...current]);
  }, []);

  const updateCollection = useCallback(async (id: string, updates: Partial<Collection>) => {
    const response = await api.updatePlaylist(id, { name: updates.name, description: updates.description });
    const nextCollection = mapCollection(response);
    setCollections((current) => current.map((collection) => (collection.id === id ? nextCollection : collection)));
  }, []);

  const deleteCollection = useCallback(async (id: string) => {
    await api.deletePlaylist(id);
    setCollections((current) => current.filter((collection) => collection.id !== id));
  }, []);

  const toggleCommentLike = useCallback(async (commentId: string) => {
    if (!isAuthenticated) return { likeCount: 0, liked: false };
    const response = await api.toggleCommentLike(commentId);
    setLikedComments((current) =>
      response.liked ? Array.from(new Set([commentId, ...current])) : current.filter((id) => id !== commentId)
    );
    return response;
  }, [isAuthenticated]);

  const addVideoToCollection = useCallback(async (collectionId: string, videoId: string) => {
    await api.addVideoToPlaylist(collectionId, videoId);
    setCollections((current) =>
      current.map((col) =>
        col.id === collectionId && !col.videos.includes(videoId)
          ? { ...col, videos: [videoId, ...col.videos] }
          : col
      )
    );
  }, []);

  const removeVideoFromCollection = useCallback(async (collectionId: string, videoId: string) => {
    await api.removeVideoFromPlaylist(collectionId, videoId);
    setCollections((current) =>
      current.map((col) =>
        col.id === collectionId
          ? { ...col, videos: col.videos.filter((id) => id !== videoId) }
          : col
      )
    );
  }, []);

  return (
    <DataContext.Provider
      value={{
        isLoading,
        videos,
        users,
        likedVideos,
        likedComments,
        watchHistory,
        subscriptions,
        collections,
        subscribedChannels,
        refreshVideos,
        addVideo,
        updateVideo,
        deleteVideo,
        toggleLike,
        toggleCommentLike,
        addToHistory,
        removeFromHistory,
        clearHistory,
        toggleSubscription,
        addCollection,
        updateCollection,
        deleteCollection,
        addVideoToCollection,
        removeVideoFromCollection,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }

  return context;
};
