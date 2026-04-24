import { Router } from "express";
import {
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
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);
router.route("/login").post(loginUser);
router.route("/google-config").get(getGoogleAuthConfig);
router.route("/google-auth").post(googleAuth);
router.route("/logout").post(logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/c/:username").get(getUserChannelProfile);
router.route("/channel/:userId").get(getUserChannelProfileById);

router.use(verifyJWT);

router.route("/change-password").post(changeCurrentPassword).patch(changeCurrentPassword);
router.route("/current-user").get(getCurrentUser);
router.route("/update-detail").patch(updateAccountDetails);
router.route("/avatar").patch(upload.single("avatar"), updateUserAvatar);
router.route("/update-cover").patch(upload.single("coverImage"), updateUserCoverImage);
router.route("/history").get(getWatchHistory).delete(clearWatchHistory);
router.route("/history/:videoId").post(addToWatchHistory).delete(removeFromWatchHistory);

export default router;
