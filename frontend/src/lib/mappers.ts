import type { Collection, Comment, Playlist, Tweet, User, Video } from '../types';

const formatDuration = (seconds: number | undefined) => {
  if (!seconds || Number.isNaN(seconds)) {
    return '0:00';
  }

  const totalSeconds = Math.max(Math.round(seconds), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const mapUser = (payload: any): User => ({
  id: payload?._id || payload?.id || '',
  name: payload?.fullName || payload?.name || 'Unknown user',
  username: payload?.username || '',
  avatar: payload?.avatar || '',
  subscribers: payload?.subscriberCount ?? payload?.subscribers ?? 0,
  subscribedToCount: payload?.subscribedToCount ?? 0,
  coverImage: payload?.coverImage || '',
  email: payload?.email || '',
});

export const mapVideo = (payload: any): Video => ({
  id: payload?._id || payload?.id || '',
  title: payload?.title || 'Untitled video',
  thumbnail: payload?.thumbnail || '',
  duration: formatDuration(payload?.duration),
  durationSeconds: payload?.duration || 0,
  views: payload?.views || 0,
  likeCount: payload?.likeCount || 0,
  videoUrl: payload?.videoUrl || payload?.video || '',
  timestamp: payload?.createdAt || payload?.timestamp || new Date().toISOString(),
  channel: mapUser(payload?.owner || payload?.channel),
  description: payload?.description || '',
  isPublished: payload?.isPublished,
});

export const mapComment = (payload: any): Comment => ({
  id: payload?._id || payload?.id || '',
  user: mapUser(payload?.owner || payload?.user),
  text: payload?.content || payload?.text || '',
  timestamp: payload?.createdAt || payload?.timestamp || new Date().toISOString(),
  likes: payload?.likeCount || payload?.likes || 0,
});

export const mapPlaylist = (payload: any): Playlist => ({
  id: payload?._id || payload?.id || '',
  title: payload?.name || payload?.title || 'Untitled playlist',
  description: payload?.description || '',
  thumbnail: payload?.thumbnail || payload?.videos?.[0]?.thumbnail || '',
  videoCount: payload?.videoCount || payload?.videos?.length || 0,
  timestamp: payload?.createdAt || payload?.timestamp || new Date().toISOString(),
  channel: payload?.owner ? mapUser(payload.owner) : undefined,
  videos: Array.isArray(payload?.videos) ? payload.videos.map(mapVideo) : [],
});

export const mapCollection = (payload: any): Collection => ({
  id: payload?._id || payload?.id || '',
  name: payload?.name || 'Untitled collection',
  description: payload?.description || '',
  videos: Array.isArray(payload?.videos)
    ? payload.videos.map((video: any) => (typeof video === 'string' ? video : video?._id || video?.id)).filter(Boolean)
    : [],
  thumbnail: payload?.thumbnail || payload?.videos?.[0]?.thumbnail || '',
  createdAt: payload?.createdAt || new Date().toISOString(),
});

export const mapTweet = (payload: any): Tweet => ({
  id: payload?._id || payload?.id || '',
  text: payload?.content || payload?.text || '',
  timestamp: payload?.createdAt || payload?.timestamp || new Date().toISOString(),
  likes: payload?.likeCount || payload?.likes || 0,
  retweets: payload?.retweets || 0,
  user: mapUser(payload?.owner || payload?.user),
});
