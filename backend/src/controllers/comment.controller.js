import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { serializeComment } from "../utils/serializers.js";

const parsePagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100);
  return { page, limit };
};

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page, limit } = parsePagination(req.query);

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const [comments, total] = await Promise.all([
    Comment.find({ video: videoId, isDeleted: false })
      .populate("owner", "fullName username avatar coverImage subscriberCount subscribers email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Comment.countDocuments({ video: videoId, isDeleted: false }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        items: comments.map(serializeComment),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(Math.ceil(total / limit), 1),
        },
      },
      "Comments fetched successfully"
    )
  );
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  if (!content?.trim()) {
    throw new ApiError(400, "Comment content is required");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const comment = await Comment.create({
    content: content.trim(),
    video: videoId,
    owner: req.user._id,
  });

  const populatedComment = await Comment.findById(comment._id).populate(
    "owner",
    "fullName username avatar coverImage subscriberCount subscribers email"
  );

  return res.status(201).json(new ApiResponse(201, serializeComment(populatedComment), "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }

  if (!content?.trim()) {
    throw new ApiError(400, "Comment content is required");
  }

  const comment = await Comment.findById(commentId).populate(
    "owner",
    "fullName username avatar coverImage subscriberCount subscribers email"
  );

  if (!comment || comment.isDeleted) {
    throw new ApiError(404, "Comment not found");
  }

  if (String(comment.owner._id) !== String(req.user._id)) {
    throw new ApiError(403, "You are not allowed to update this comment");
  }

  comment.content = content.trim();
  await comment.save();

  return res.status(200).json(new ApiResponse(200, serializeComment(comment), "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }

  const comment = await Comment.findById(commentId).populate("owner", "_id");
  if (!comment || comment.isDeleted) {
    throw new ApiError(404, "Comment not found");
  }

  if (String(comment.owner._id) !== String(req.user._id)) {
    throw new ApiError(403, "You are not allowed to delete this comment");
  }

  comment.isDeleted = true;
  await comment.save();

  return res.status(200).json(new ApiResponse(200, { _id: commentId }, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
