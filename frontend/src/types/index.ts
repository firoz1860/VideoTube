export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  subscribers?: number;
  subscribedToCount?: number;
  coverImage?: string;
  email?: string;
}

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  durationSeconds?: number;
  views: number;
  likeCount?: number;
  videoUrl?: string;
  timestamp: string;
  channel: User;
  description?: string;
  isPublished?: boolean;
}

export interface Comment {
  id: string;
  user: User;
  text: string;
  timestamp: string;
  likes?: number;
  isLiked?: boolean;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoCount: number;
  timestamp: string;
  channel?: User;
  videos?: Video[];
}

export interface Tweet {
  id: string;
  text: string;
  timestamp: string;
  likes: number;
  retweets: number;
  user: User;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  videos: string[];
  thumbnail: string;
  createdAt: string;
}
