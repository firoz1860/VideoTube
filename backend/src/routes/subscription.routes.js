import { Router } from "express";
import {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/:channelId/subscribers").get(getUserChannelSubscribers);
router.route("/user/:subscriberId").get(getSubscribedChannels);
router.route("/:channelId").post(verifyJWT, toggleSubscription);

export default router;
