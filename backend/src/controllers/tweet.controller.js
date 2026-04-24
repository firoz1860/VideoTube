import mongoose from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Tweet } from "../models/tweet.model.js";
import { serializeTweet } from "../utils/serializers.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content, photo, video } = req.body;

  if (!content?.trim()) {
    throw new ApiError(400, "Tweet content is required");
  }

  const tweet = await Tweet.create({
    content: content.trim(),
    photo: typeof photo === "string" ? photo : "",
    video: typeof video === "string" ? video : "",
    owner: req.user._id,
  });

  const populatedTweet = await Tweet.findById(tweet._id).populate(
    "owner",
    "fullName username avatar coverImage subscriberCount subscribers email"
  );

  return res.status(201).json(new ApiResponse(201, serializeTweet(populatedTweet), "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  const tweets = await Tweet.find({ owner: userId })
    .populate("owner", "fullName username avatar coverImage subscriberCount subscribers email")
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, tweets.map(serializeTweet), "Tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content, photo, video } = req.body;

  if (!mongoose.isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
  }

  const tweet = await Tweet.findById(tweetId).populate(
    "owner",
    "fullName username avatar coverImage subscriberCount subscribers email"
  );

  if (!tweet) throw new ApiError(404, "Tweet not found");
  if (String(tweet.owner._id) !== String(req.user._id)) {
    throw new ApiError(403, "You are not authorized to update this tweet");
  }

  if (content?.trim()) tweet.content = content.trim();
  if (typeof photo === "string") tweet.photo = photo;
  if (typeof video === "string") tweet.video = video;
  await tweet.save();

  return res.status(200).json(new ApiResponse(200, serializeTweet(tweet), "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!mongoose.isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) throw new ApiError(404, "Tweet not found");
  if (String(tweet.owner) !== String(req.user._id)) {
    throw new ApiError(403, "You are not authorized to delete this tweet");
  }

  await tweet.deleteOne();
  return res.status(200).json(new ApiResponse(200, { _id: tweetId }, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
