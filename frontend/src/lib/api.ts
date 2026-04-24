const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

type RequestOptions = RequestInit & {
  isFormData?: boolean;
  retryOnAuthError?: boolean;
};

let refreshRequest: Promise<boolean> | null = null;

const parsePayload = async (response: Response) => response.json().catch(() => ({}));

const shouldRefreshSession = (path: string, status: number, retryOnAuthError: boolean) => {
  if (!retryOnAuthError || status !== 401) {
    return false;
  }

  return !['/users/login', '/users/register', '/users/refresh-token'].includes(path);
};

const refreshSession = async () => {
  if (!refreshRequest) {
    refreshRequest = fetch(`${API_URL}/users/refresh-token`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { isFormData = false, retryOnAuthError = true, headers, ...init } = options;

  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: isFormData
      ? headers
      : {
          'Content-Type': 'application/json',
          ...headers,
        },
    ...init,
  });

  if (shouldRefreshSession(path, response.status, retryOnAuthError)) {
    const refreshed = await refreshSession();

    if (refreshed) {
      return request<T>(path, {
        ...options,
        retryOnAuthError: false,
      });
    }
  }

  const payload = await parsePayload(response);

  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload.data as T;
}

const toSearchParams = (params: Record<string, string | number | undefined>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

export const api = {
  getVideos: (params: Record<string, string | number | undefined> = {}) =>
    request<{ items: unknown[]; pagination: unknown }>(`/videos${toSearchParams(params)}`),
  getVideo: (videoId: string) => request<unknown>(`/videos/${videoId}`),
  createVideo: (formData: FormData) =>
    request<unknown>('/videos', { method: 'POST', body: formData, isFormData: true }),
  updateVideo: (videoId: string, payload: FormData | Record<string, unknown>) =>
    request<unknown>(`/videos/${videoId}`, {
      method: 'PATCH',
      body: payload instanceof FormData ? payload : JSON.stringify(payload),
      isFormData: payload instanceof FormData,
    }),
  deleteVideo: (videoId: string) => request<{ _id: string }>(`/videos/${videoId}`, { method: 'DELETE' }),
  getVideoComments: (videoId: string) =>
    request<{ items: unknown[]; pagination: unknown }>(`/comments/video/${videoId}`),
  createComment: (videoId: string, content: string) =>
    request<unknown>(`/comments/video/${videoId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  toggleVideoLike: (videoId: string) =>
    request<{ likeCount: number; liked: boolean }>(`/likes/toggle/v/${videoId}`, { method: 'POST' }),
  getLikedVideos: () => request<unknown[]>('/likes/videos'),
  getWatchHistory: () => request<unknown[]>('/users/history'),
  addToWatchHistory: (videoId: string) => request(`/users/history/${videoId}`, { method: 'POST' }),
  removeFromWatchHistory: (videoId: string) => request(`/users/history/${videoId}`, { method: 'DELETE' }),
  clearWatchHistory: () => request('/users/history', { method: 'DELETE' }),
  getChannelById: (userId: string) => request<unknown>(`/users/channel/${userId}`),
  getChannelByUsername: (username: string) => request<unknown>(`/users/c/${username}`),
  getSubscribedChannels: (userId: string) => request<unknown[]>(`/subscriptions/user/${userId}`),
  getChannelSubscribers: (channelId: string) =>
    request<{ channel: unknown; subscribers: unknown[] }>(`/subscriptions/${channelId}/subscribers`),
  toggleSubscription: (channelId: string) =>
    request<{ channelId: string; subscribed: boolean; subscriberCount: number }>(`/subscriptions/${channelId}`, {
      method: 'POST',
    }),
  getUserPlaylists: (userId: string) => request<unknown[]>(`/playlists/user/${userId}`),
  getPlaylist: (playlistId: string) => request<unknown>(`/playlists/${playlistId}`),
  createPlaylist: (payload: { name: string; description: string }) =>
    request<unknown>('/playlists', { method: 'POST', body: JSON.stringify(payload) }),
  updatePlaylist: (playlistId: string, payload: { name?: string; description?: string }) =>
    request<unknown>(`/playlists/${playlistId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deletePlaylist: (playlistId: string) => request(`/playlists/${playlistId}`, { method: 'DELETE' }),
  getUserTweets: (userId: string) => request<unknown[]>(`/tweets/user/${userId}`),
  toggleCommentLike: (commentId: string) =>
    request<{ likeCount: number; liked: boolean }>(`/likes/toggle/c/${commentId}`, { method: 'POST' }),
  deleteComment: (commentId: string) => request<{ _id: string }>(`/comments/${commentId}`, { method: 'DELETE' }),
  updateComment: (commentId: string, content: string) =>
    request<unknown>(`/comments/${commentId}`, { method: 'PATCH', body: JSON.stringify({ content }) }),
  addVideoToPlaylist: (playlistId: string, videoId: string) =>
    request<unknown>(`/playlists/${playlistId}/videos/${videoId}`, { method: 'POST' }),
  removeVideoFromPlaylist: (playlistId: string, videoId: string) =>
    request<unknown>(`/playlists/${playlistId}/videos/${videoId}`, { method: 'DELETE' }),
};

export { API_URL, request };
