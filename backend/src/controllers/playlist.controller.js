import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { serializePlaylist } from "../utils/serializers.js";

const populatePlaylist = (query) =>
  query
    .populate("owner", "fullName username avatar coverImage subscriberCount subscribers email")
    .populate({
      path: "videos",
      populate: {
        path: "owner",
        select: "fullName username avatar coverImage subscriberCount subscribers email",
      },
    });

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name?.trim()) {
    throw new ApiError(400, "Name is required");
  }

  const playlist = await Playlist.create({
    name: name.trim(),
    description: description?.trim() || "",
    owner: req.user._id,
  });

  const populatedPlaylist = await populatePlaylist(Playlist.findById(playlist._id));
  return res.status(201).json(new ApiResponse(201, serializePlaylist(populatedPlaylist), "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  const playlists = await populatePlaylist(Playlist.find({ owner: userId }).sort({ createdAt: -1 }));
  return res.status(200).json(new ApiResponse(200, playlists.map(serializePlaylist), "Playlists fetched successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!mongoose.isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  const playlist = await populatePlaylist(Playlist.findById(playlistId));
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res.status(200).json(new ApiResponse(200, serializePlaylist(playlist), "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!mongoose.isValidObjectId(playlistId) || !mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist or video id");
  }

  const [playlist, video] = await Promise.all([Playlist.findById(playlistId), Video.findById(videoId)]);

  if (!playlist) throw new ApiError(404, "Playlist not found");
  if (!video) throw new ApiError(404, "Video not found");
  if (String(playlist.owner) !== String(req.user._id)) {
    throw new ApiError(403, "You are not authorized to update this playlist");
  }

  if (!playlist.videos.some((id) => String(id) === String(videoId))) {
    playlist.videos.push(videoId);
    await playlist.save();
  }

  const populatedPlaylist = await populatePlaylist(Playlist.findById(playlistId));
  return res.status(200).json(new ApiResponse(200, serializePlaylist(populatedPlaylist), "Video added to playlist"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!mongoose.isValidObjectId(playlistId) || !mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist or video id");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new ApiError(404, "Playlist not found");
  if (String(playlist.owner) !== String(req.user._id)) {
    throw new ApiError(403, "You are not authorized to update this playlist");
  }

  playlist.videos = playlist.videos.filter((id) => String(id) !== String(videoId));
  await playlist.save();

  const populatedPlaylist = await populatePlaylist(Playlist.findById(playlistId));
  return res.status(200).json(new ApiResponse(200, serializePlaylist(populatedPlaylist), "Video removed from playlist"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!mongoose.isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new ApiError(404, "Playlist not found");
  if (String(playlist.owner) !== String(req.user._id)) {
    throw new ApiError(403, "You are not authorized to delete this playlist");
  }

  await playlist.deleteOne();
  return res.status(200).json(new ApiResponse(200, { _id: playlistId }, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!mongoose.isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new ApiError(404, "Playlist not found");
  if (String(playlist.owner) !== String(req.user._id)) {
    throw new ApiError(403, "You are not authorized to update this playlist");
  }

  if (name?.trim()) playlist.name = name.trim();
  if (description?.trim()) playlist.description = description.trim();
  await playlist.save();

  const populatedPlaylist = await populatePlaylist(Playlist.findById(playlistId));
  return res.status(200).json(new ApiResponse(200, serializePlaylist(populatedPlaylist), "Playlist updated successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
