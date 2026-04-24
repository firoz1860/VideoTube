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

const connectDB = async () => {
  try {
    const mongoUrl = buildMongoUrl();
    const connectionInstance = await mongoose.connect(mongoUrl);
    console.log(`MongoDB connected: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.log("MongoDB connection failed:", error?.message || error);
    process.exit(1);
  }
};

export default connectDB;
