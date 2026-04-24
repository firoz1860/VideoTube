import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { serializeVideo } from "../utils/serializers.js";

const toggleLikeForEntity = async ({ entityId, entityModel, likeFilter, messageLabel }) => {
  const entity = await entityModel.findById(entityId);
  if (!entity) {
    throw new ApiError(404, `${messageLabel} not found`);
  }

  const existingLike = await Like.findOne(likeFilter);

  if (existingLike) {
    await existingLike.deleteOne();
    entity.likeCount = Math.max(0, (entity.likeCount || 0) - 1);
    await entity.save();

    return { likeCount: entity.likeCount, liked: false, message: `${messageLabel} unliked successfully` };
  }

  await Like.create(likeFilter);
  entity.likeCount = (entity.likeCount || 0) + 1;
  await entity.save();

  return { likeCount: entity.likeCount, liked: true, message: `${messageLabel} liked successfully` };
};

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const result = await toggleLikeForEntity({
    entityId: videoId,
    entityModel: Video,
    likeFilter: { video: videoId, likedBy: req.user._id },
    messageLabel: "Video",
  });

  return res.status(200).json(new ApiResponse(200, result, result.message));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }

  const result = await toggleLikeForEntity({
    entityId: commentId,
    entityModel: Comment,
    likeFilter: { comment: commentId, likedBy: req.user._id },
    messageLabel: "Comment",
  });

  return res.status(200).json(new ApiResponse(200, result, result.message));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!mongoose.isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
  }

  const result = await toggleLikeForEntity({
    entityId: tweetId,
    entityModel: Tweet,
    likeFilter: { tweet: tweetId, likedBy: req.user._id },
    messageLabel: "Tweet",
  });

  return res.status(200).json(new ApiResponse(200, result, result.message));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const likes = await Like.find({ likedBy: req.user._id, video: { $exists: true, $ne: null } })
    .populate({
      path: "video",
      populate: {
        path: "owner",
        select: "fullName username avatar coverImage subscriberCount subscribers email",
      },
    })
    .sort({ createdAt: -1 });

  const videos = likes.map((like) => like.video).filter(Boolean).map(serializeVideo);

  return res.status(200).json(new ApiResponse(200, videos, "Liked videos fetched successfully"));
});

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos };
