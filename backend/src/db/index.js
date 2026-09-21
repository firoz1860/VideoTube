import mongoose from "mongoose";

import { DB_NAME } from "../constants.js";

const buildMongoUrl = () => {
  const baseUrl = process.env.MONGODB_URL;
  const dbName = process.env.MONGODB_DB_NAME || DB_NAME;

  if (!baseUrl) {
    throw new Error("MONGODB_URL is not set");
  }

  const hasDatabaseInPath = /mongodb(?:\+srv)?:\/\/[^/]+\/[^?]+/.test(baseUrl);
  return hasDatabaseInPath ? baseUrl : `${baseUrl}/${dbName}`;
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Connect to MongoDB with a bounded retry loop. Never calls process.exit():
// killing the process on a transient DB error takes the whole service (and the
// open HTTP port) down, which fails the deploy. Instead we log each attempt and
// keep the server running; mongoose will also auto-reconnect once reachable.
const connectDB = async (retries = 5, delayMs = 5000) => {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const mongoUrl = buildMongoUrl();
      const connectionInstance = await mongoose.connect(mongoUrl, {
        // Fail fast on an unreachable cluster instead of hanging indefinitely.
        serverSelectionTimeoutMS: 10000,
      });
      console.log(`MongoDB connected: ${connectionInstance.connection.host}`);
      return true;
    } catch (error) {
      console.error(
        `MongoDB connection attempt ${attempt}/${retries} failed:`,
        error?.message || error
      );

      if (attempt < retries) {
        await wait(delayMs);
      }
    }
  }

  console.error(
    "MongoDB: all connection attempts failed. The server is running but the " +
      "database is unavailable — check MONGODB_URL and the cluster's network " +
      "access (IP allowlist)."
  );
  return false;
};

export default connectDB;
