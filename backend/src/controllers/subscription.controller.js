import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { serializeUser } from "../utils/serializers.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscriberId = req.user._id;

  if (!mongoose.isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel id");
  }

  if (String(channelId) === String(subscriberId)) {
    throw new ApiError(400, "You cannot subscribe to your own channel");
  }

  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  const existingSubscription = await Subscription.findOne({ subscriber: subscriberId, channel: channelId });

  if (existingSubscription) {
    await existingSubscription.deleteOne();
    channel.subscriberCount = Math.max(0, channel.subscriberCount - 1);
    channel.subscribers = channel.subscribers.filter((id) => String(id) !== String(subscriberId));
    await channel.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        { channelId, subscribed: false, subscriberCount: channel.subscriberCount },
        "Channel unsubscribed successfully"
      )
    );
  }

  await Subscription.create({ subscriber: subscriberId, channel: channelId });
  channel.subscriberCount += 1;
  channel.subscribers.push(subscriberId);
  await channel.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      { channelId, subscribed: true, subscriberCount: channel.subscriberCount },
      "Channel subscribed successfully"
    )
  );
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!mongoose.isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel id");
  }

  const [channel, subscriptions] = await Promise.all([
    User.findById(channelId),
    Subscription.find({ channel: channelId })
      .populate("subscriber", "fullName username avatar coverImage subscriberCount subscribers email")
      .sort({ createdAt: -1 }),
  ]);

  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        channel: serializeUser(channel),
        subscribers: subscriptions.map((subscription) => serializeUser(subscription.subscriber)).filter(Boolean),
      },
      "Subscribers fetched successfully"
    )
  );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!mongoose.isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriber id");
  }

  const subscriptions = await Subscription.find({ subscriber: subscriberId })
    .populate("channel", "fullName username avatar coverImage subscriberCount subscribers email")
    .sort({ createdAt: -1 });

  const channels = subscriptions.map((subscription) => serializeUser(subscription.channel)).filter(Boolean);

  return res.status(200).json(new ApiResponse(200, channels, "Subscribed channels fetched successfully"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
