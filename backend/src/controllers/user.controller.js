import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import { OAuth2Client } from "google-auth-library";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { persistLocalUpload, deleteLocalAsset, isLocalAssetUrl } from "../utils/localUploads.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { serializeUser, serializeVideo } from "../utils/serializers.js";

const googleClient = new OAuth2Client();

const getCookieOptions = () => {
  // In production (cross-origin between Vercel + Render), cookies need
  // secure:true + sameSite:"none" or browsers will silently drop them.
  const isProduction = process.env.NODE_ENV === "production";
  const secure = process.env.COOKIE_SECURE === "true" || isProduction;
  const defaultSameSite = isProduction ? "none" : "lax";
  let sameSite = process.env.COOKIE_SAME_SITE || defaultSameSite;

  if (sameSite === "none" && !secure) {
    sameSite = "lax";
  }

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
  };
};

const generateAccessAndRefreshToken = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

const getSafeUserById = (userId) => User.findById(userId).select("-password -refreshToken");

const toUsernameBase = (value) =>
  (value || "user")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24) || "user";

const ensureUniqueUsername = async (baseValue) => {
  const base = toUsernameBase(baseValue);
  let candidate = base;
  let attempt = 0;

  while (attempt < 20) {
    const exists = await User.exists({ username: candidate });
    if (!exists) {
      return candidate;
    }

    attempt += 1;
    candidate = `${base}${attempt}`.slice(0, 28);
  }

  return `${base}${Date.now().toString().slice(-4)}`.slice(0, 28);
};

const uploadImageWithFallback = async (localFilePath, folderName, req) => {
  const cloudinaryUpload = await uploadOnCloudinary(localFilePath, {
    resource_type: "image",
    folder: folderName,
  });

  if (cloudinaryUpload?.secure_url) {
    return cloudinaryUpload;
  }

  return persistLocalUpload(localFilePath, folderName, req);
};

const deleteStoredImage = async (fileUrl) => {
  if (!fileUrl) {
    return false;
  }

  if (isLocalAssetUrl(fileUrl)) {
    return deleteLocalAsset(fileUrl);
  }

  return deleteFromCloudinary(fileUrl).catch(() => false);
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;

  if ([fullName, email, username, password].some((field) => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({
    $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
  });

  if (existingUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  const [avatarUpload, coverUpload] = await Promise.all([
    avatarLocalPath
      ? uploadImageWithFallback(avatarLocalPath, "avatars", req)
      : Promise.resolve(null),
    coverImageLocalPath
      ? uploadImageWithFallback(coverImageLocalPath, "covers", req)
      : Promise.resolve(null),
  ]);

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName.trim())}&background=0F1729&color=ffffff`;

  const user = await User.create({
    fullName: fullName.trim(),
    avatar: avatarUpload?.secure_url || fallbackAvatar,
    coverImage: coverUpload?.secure_url || "",
    email: email.trim().toLowerCase(),
    password,
    username: username.trim().toLowerCase(),
  });

  const createdUser = await getSafeUserById(user._id);
  return res.status(201).json(new ApiResponse(201, serializeUser(createdUser), "User created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if ((!email && !username) || !password) {
    throw new ApiError(400, "Email or username and password are required");
  }

  const user = await User.findOne({
    $or: [{ username: username?.toLowerCase() }, { email: email?.toLowerCase() }],
  });

  if (!user) throw new ApiError(404, "User not found");

  const isPasswordMatched = await user.isPasswordCorrect(password);
  if (!isPasswordMatched) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
  const loggedInUser = await getSafeUserById(user._id);

  return res
    .status(200)
    .cookie("accessToken", accessToken, getCookieOptions())
    .cookie("refreshToken", refreshToken, getCookieOptions())
    .json(new ApiResponse(200, serializeUser(loggedInUser), "Login successful"));
});

const getGoogleAuthConfig = asyncHandler(async (_req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        enabled: Boolean(clientId),
        clientId,
      },
      "Google auth config fetched successfully"
    )
  );
});

const googleAuth = asyncHandler(async (req, res) => {
  const { credential } = req.body;
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new ApiError(500, "Google auth is not configured");
  }

  if (!credential?.trim()) {
    throw new ApiError(400, "Google credential is required");
  }

  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
  } catch {
    throw new ApiError(401, "Invalid Google credential");
  }

  const payload = ticket.getPayload();
  if (!payload?.email || !payload.sub || !payload.email_verified) {
    throw new ApiError(401, "Google account email is not verified");
  }

  const email = payload.email.toLowerCase();
  const fullName = payload.name?.trim() || email.split("@")[0];
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0F1729&color=ffffff`;

  let user = await User.findOne({
    $or: [{ email }, { googleId: payload.sub }],
  });

  if (!user) {
    const username = await ensureUniqueUsername(payload.given_name || payload.name || email.split("@")[0]);
    user = await User.create({
      fullName,
      email,
      username,
      avatar: payload.picture || fallbackAvatar,
      password: randomBytes(24).toString("hex"),
      googleId: payload.sub,
      authProvider: "google",
    });
  } else {
    let shouldSave = false;

    if (!user.googleId) {
      user.googleId = payload.sub;
      shouldSave = true;
    }

    if (!user.avatar && payload.picture) {
      user.avatar = payload.picture;
      shouldSave = true;
    }

    if (!user.fullName && fullName) {
      user.fullName = fullName;
      shouldSave = true;
    }

    if (shouldSave) {
      await user.save({ validateBeforeSave: false });
    }
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
  const loggedInUser = await getSafeUserById(user._id);

  return res
    .status(200)
    .cookie("accessToken", accessToken, getCookieOptions())
    .cookie("refreshToken", refreshToken, getCookieOptions())
    .json(new ApiResponse(200, serializeUser(loggedInUser), "Google login successful"));
});

const logoutUser = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (incomingRefreshToken) {
    await User.findOneAndUpdate(
      { refreshToken: incomingRefreshToken },
      { $unset: { refreshToken: 1 } },
      { new: true }
    );
  }

  return res
    .status(200)
    .clearCookie("accessToken", getCookieOptions())
    .clearCookie("refreshToken", getCookieOptions())
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized request");

  const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  const user = await User.findById(decodedToken?._id);

  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

  return res
    .status(200)
    .cookie("accessToken", accessToken, getCookieOptions())
    .cookie("refreshToken", refreshToken, getCookieOptions())
    .json(new ApiResponse(200, { accessToken, refreshToken }, "Access token refreshed successfully"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current password and new password are required");
  }

  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");

  const isPasswordMatched = await user.isPasswordCorrect(currentPassword);
  if (!isPasswordMatched) throw new ApiError(401, "Invalid current password");

  user.password = newPassword;
  await user.save();

  return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, serializeUser(req.user), "User fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email, username } = req.body;

  if (!fullName?.trim() || !email?.trim()) {
    throw new ApiError(400, "Full name and email are required");
  }

  if (username?.trim()) {
    const existingUser = await User.findOne({
      _id: { $ne: req.user._id },
      username: username.trim().toLowerCase(),
    });

    if (existingUser) {
      throw new ApiError(409, "Username already exists");
    }
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        ...(username?.trim() ? { username: username.trim().toLowerCase() } : {}),
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res.status(200).json(new ApiResponse(200, serializeUser(user), "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  if (!req.file?.path) throw new ApiError(400, "Avatar file is missing");

  const avatarUpload = await uploadImageWithFallback(req.file.path, "avatars", req);

  if (!avatarUpload?.secure_url) throw new ApiError(500, "Failed to upload avatar");

  const existingUser = await User.findById(req.user._id);
  if (!existingUser) throw new ApiError(404, "User not found");

  const oldAvatar = existingUser.avatar;
  existingUser.avatar = avatarUpload.secure_url;
  await existingUser.save();

  if (oldAvatar && oldAvatar !== avatarUpload.secure_url) {
    await deleteStoredImage(oldAvatar);
  }

  return res.status(200).json(new ApiResponse(200, serializeUser(existingUser), "Avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  if (!req.file?.path) throw new ApiError(400, "Cover image file is missing");

  const coverUpload = await uploadImageWithFallback(req.file.path, "covers", req);

  if (!coverUpload?.secure_url) throw new ApiError(500, "Failed to upload cover image");

  const existingUser = await User.findById(req.user._id);
  if (!existingUser) throw new ApiError(404, "User not found");

  const oldCoverImage = existingUser.coverImage;
  existingUser.coverImage = coverUpload.secure_url;
  await existingUser.save();

  if (oldCoverImage && oldCoverImage !== coverUpload.secure_url) {
    await deleteStoredImage(oldCoverImage);
  }

  return res.status(200).json(new ApiResponse(200, serializeUser(existingUser), "Cover image updated successfully"));
});

const buildChannelProfile = async (userId) => {
  const user = await User.findById(userId).select("-password -refreshToken");
  if (!user) throw new ApiError(404, "Channel not found");

  const [subscriberCount, subscribedToCount] = await Promise.all([
    Subscription.countDocuments({ channel: userId }),
    Subscription.countDocuments({ subscriber: userId }),
  ]);

  return {
    ...serializeUser(user),
    subscriberCount,
    subscribedToCount,
  };
};

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) throw new ApiError(400, "Username is required");

  const user = await User.findOne({ username: username.trim().toLowerCase() }).select("_id");
  if (!user) throw new ApiError(404, "Channel not found");

  const profile = await buildChannelProfile(user._id);
  return res.status(200).json(new ApiResponse(200, profile, "Channel fetched successfully"));
});

const getUserChannelProfileById = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.isValidObjectId(userId)) throw new ApiError(400, "Invalid user id");

  const profile = await buildChannelProfile(userId);
  return res.status(200).json(new ApiResponse(200, profile, "Channel fetched successfully"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: "watchHistory",
    populate: {
      path: "owner",
      select: "fullName username avatar coverImage subscriberCount subscribers email",
    },
  });

  const history = (user?.watchHistory || []).map(serializeVideo);
  return res.status(200).json(new ApiResponse(200, history, "Watch history fetched successfully"));
});

const addToWatchHistory = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!mongoose.isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");

  const user = await User.findById(req.user._id);
  user.watchHistory = user.watchHistory.filter((id) => String(id) !== String(videoId));
  user.watchHistory.unshift(video._id);
  await user.save();

  return res.status(200).json(new ApiResponse(200, { videoId }, "Watch history updated successfully"));
});

const removeFromWatchHistory = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!mongoose.isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");

  const user = await User.findById(req.user._id);
  user.watchHistory = user.watchHistory.filter((id) => String(id) !== String(videoId));
  await user.save();

  return res.status(200).json(new ApiResponse(200, { videoId }, "Video removed from watch history"));
});

const clearWatchHistory = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $set: { watchHistory: [] } });
  return res.status(200).json(new ApiResponse(200, [], "Watch history cleared successfully"));
});

export {
  registerUser,
  loginUser,
  getGoogleAuthConfig,
  googleAuth,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getUserChannelProfileById,
  getWatchHistory,
  addToWatchHistory,
  removeFromWatchHistory,
  clearWatchHistory,
};
