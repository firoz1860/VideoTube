const serializeUser = (user) => {
  if (!user) {
    return null;
  }

  const subscriberCount =
    typeof user.subscriberCount === "number"
      ? user.subscriberCount
      : Array.isArray(user.subscribers)
        ? user.subscribers.length
        : 0;

  return {
    _id: String(user._id || user.id || ""),
    fullName: user.fullName || user.name || "User",
    username: user.username || "",
    avatar: user.avatar || "",
    coverImage: user.coverImage || "",
    email: user.email || "",
    subscriberCount,
  };
};

const serializeVideo = (video) => {
  if (!video) {
    return null;
  }

  return {
    _id: String(video._id || video.id || ""),
    title: video.title,
    description: video.description || "",
    thumbnail: video.thumbnail || "",
    videoUrl: video.video || video.videoUrl || "",
    duration: video.duration || 0,
    views: video.views || 0,
    likeCount: video.likeCount || 0,
    isPublished: typeof video.isPublished === "boolean" ? video.isPublished : true,
    createdAt: video.createdAt,
    updatedAt: video.updatedAt,
    owner: serializeUser(video.owner),
  };
};

const serializeComment = (comment) => {
  if (!comment) {
    return null;
  }

  return {
    _id: String(comment._id || comment.id || ""),
    content: comment.content || "",
    likeCount: comment.likeCount || 0,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    owner: serializeUser(comment.owner),
    video: comment.video ? String(comment.video) : undefined,
  };
};

const serializePlaylist = (playlist) => {
  if (!playlist) {
    return null;
  }

  const videos = Array.isArray(playlist.videos) ? playlist.videos.map(serializeVideo).filter(Boolean) : [];

  return {
    _id: String(playlist._id || playlist.id || ""),
    name: playlist.name,
    description: playlist.description || "",
    createdAt: playlist.createdAt,
    updatedAt: playlist.updatedAt,
    owner: serializeUser(playlist.owner),
    videos,
    videoCount: videos.length,
    thumbnail: videos[0]?.thumbnail || "",
  };
};

const serializeTweet = (tweet) => {
  if (!tweet) {
    return null;
  }

  return {
    _id: String(tweet._id || tweet.id || ""),
    content: tweet.content || "",
    photo: tweet.photo || "",
    video: tweet.video || "",
    likeCount: tweet.likeCount || 0,
    createdAt: tweet.createdAt,
    updatedAt: tweet.updatedAt,
    owner: serializeUser(tweet.owner),
  };
};

export {
  serializeUser,
  serializeVideo,
  serializeComment,
  serializePlaylist,
  serializeTweet,
};
