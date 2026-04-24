import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { uploadOnCloudinary, deleteFromCloudinary, cleanupLocalFile } from "../utils/cloudinary.js";
import { deleteLocalAsset, isLocalAssetUrl, persistLocalUpload } from "../utils/localUploads.js";
import { serializeVideo } from "../utils/serializers.js";

const uploadWithFallback = async (localFilePath, folderName, req, resourceType = "auto") => {
  const cloudinaryUpload = await uploadOnCloudinary(localFilePath, {
    resource_type: resourceType,
    folder: folderName,
  });

  if (cloudinaryUpload?.secure_url) {
    return cloudinaryUpload;
  }

  return persistLocalUpload(localFilePath, folderName, req);
};

const deleteStoredAsset = async (fileUrl, options = {}) => {
  if (!fileUrl) {
    return false;
  }

  if (isLocalAssetUrl(fileUrl)) {
    return deleteLocalAsset(fileUrl);
  }

  return deleteFromCloudinary(fileUrl, options).catch(() => false);
};

const parsePagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 12, 1), 50);
  return { page, limit };
};

const getAllVideos = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { query = "", userId, sortBy = "createdAt", sortType = "desc" } = req.query;

  const match = { isPublished: true };

  if (query) {
    match.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  if (userId && mongoose.isValidObjectId(userId)) {
    match.owner = userId;
  }

  const sortableFields = new Set(["createdAt", "views", "likeCount", "title"]);
  const sortField = sortableFields.has(sortBy) ? sortBy : "createdAt";
  const sortDirection = sortType === "asc" ? 1 : -1;

  const [items, total] = await Promise.all([
    Video.find(match)
      .populate("owner", "fullName username avatar coverImage subscriberCount subscribers email")
      .sort({ [sortField]: sortDirection })
      .skip((page - 1) * limit)
      .limit(limit),
    Video.countDocuments(match),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        items: items.map(serializeVideo),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(Math.ceil(total / limit), 1),
        },
      },
      "Videos fetched successfully"
    )
  );
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } }, { new: true }).populate(
    "owner",
    "fullName username avatar coverImage subscriberCount subscribers email"
  );

  if (!video || !video.isPublished) {
    throw new ApiError(404, "Video not found");
  }

  return res.status(200).json(new ApiResponse(200, serializeVideo(video), "Video fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const videoFile = req.files?.videoFile?.[0];
  const thumbnailFile = req.files?.thumbnail?.[0];

  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "Title and description are required");
  }

  if (!videoFile?.path || !thumbnailFile?.path) {
    throw new ApiError(400, "Video file and thumbnail are required");
  }

  const [videoUpload, thumbnailUpload] = await Promise.all([
    uploadWithFallback(videoFile.path, "videos", req, "video"),
    uploadWithFallback(thumbnailFile.path, "thumbnails", req, "image"),
  ]);

  if (!videoUpload?.secure_url || !thumbnailUpload?.secure_url) {
    cleanupLocalFile(videoFile?.path);
    cleanupLocalFile(thumbnailFile?.path);
    throw new ApiError(500, "Failed to upload video assets");
  }

  const createdVideo = await Video.create({
    video: videoUpload.secure_url,
    thumbnail: thumbnailUpload.secure_url,
    title: title.trim(),
    description: description.trim(),
    duration: Math.ceil(videoUpload.duration || 0),
    owner: req.user._id,
  });

  const populatedVideo = await Video.findById(createdVideo._id).populate(
    "owner",
    "fullName username avatar coverImage subscriberCount subscribers email"
  );

  return res.status(201).json(new ApiResponse(201, serializeVideo(populatedVideo), "Video created successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId).populate("owner", "fullName username avatar coverImage subscriberCount subscribers email");
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (String(video.owner._id) !== String(req.user._id)) {
    throw new ApiError(403, "You are not allowed to update this video");
  }

  if (title?.trim()) video.title = title.trim();
  if (description?.trim()) video.description = description.trim();

  if (req.file?.path) {
    const thumbnailUpload = await uploadWithFallback(req.file.path, "thumbnails", req, "image");

    if (!thumbnailUpload?.secure_url) {
      cleanupLocalFile(req.file.path);
      throw new ApiError(500, "Failed to upload thumbnail");
    }

    if (video.thumbnail) {
      await deleteStoredAsset(video.thumbnail);
    }

    video.thumbnail = thumbnailUpload.secure_url;
  }

  await video.save();
  await video.populate("owner", "fullName username avatar coverImage subscriberCount subscribers email");

  return res.status(200).json(new ApiResponse(200, serializeVideo(video), "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (String(video.owner) !== String(req.user._id)) {
    throw new ApiError(403, "You are not allowed to delete this video");
  }

  await deleteStoredAsset(video.video, { resource_type: "video" });
  await deleteStoredAsset(video.thumbnail);
  await video.deleteOne();

  return res.status(200).json(new ApiResponse(200, { _id: videoId }, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId).populate("owner", "fullName username avatar coverImage subscriberCount subscribers email");
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (String(video.owner._id) !== String(req.user._id)) {
    throw new ApiError(403, "You are not allowed to update this video");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  return res.status(200).json(
    new ApiResponse(200, serializeVideo(video), `Video ${video.isPublished ? "published" : "unpublished"} successfully`)
  );
});

export { getAllVideos, publishAVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus };
