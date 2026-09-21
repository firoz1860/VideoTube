import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

// Liveness/readiness check. Always responds 200 while the process is alive so a
// platform health check never fails the deploy over a transient DB issue; the
// database state is reported in the body. Stats are only gathered when the DB
// is actually connected, so this never throws on an undefined connection.
const healthcheck = asyncHandler(async (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  let stats = { usersCount: 0, videosCount: 0, subscriptionsCount: 0 };

  if (isDbConnected) {
    try {
      const statsPipeline = [
        {
          $facet: {
            users: [{ $count: "count" }],
            videos: [{ $count: "count" }],
            subscriptions: [{ $count: "count" }],
          },
        },
        {
          $project: {
            usersCount: { $arrayElemAt: ["$users.count", 0] },
            videosCount: { $arrayElemAt: ["$videos.count", 0] },
            subscriptionsCount: { $arrayElemAt: ["$subscriptions.count", 0] },
          },
        },
      ];

      const aggregated = await mongoose.connection.db
        .collection("users")
        .aggregate(statsPipeline)
        .toArray();

      stats = aggregated[0] || stats;
    } catch (error) {
      console.error("Healthcheck stats error:", error?.message || error);
    }
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        status: "OK",
        dbStatus: isDbConnected ? "Connected" : "Disconnected",
        stats,
      },
      "Healthcheck passed"
    )
  );
});

export { healthcheck };
