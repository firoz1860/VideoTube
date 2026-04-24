import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cleanupLocalFile = (localFilePath) => {
  if (localFilePath && fs.existsSync(localFilePath)) {
    fs.unlinkSync(localFilePath);
  }
};

const uploadOnCloudinary = async (localFilePath, options = {}) => {
  try {
    if (!localFilePath) {
      throw new Error("File path is required");
    }

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      ...options,
    });

    cleanupLocalFile(localFilePath);
    return response;
  } catch (error) {
    console.error("Cloudinary upload failed:", error?.message || error);
    return null;
  }
};

const extractPublicIdFromUrl = (fileUrl) => {
  try {
    const uploadIndex = fileUrl.indexOf("/upload/");
    if (uploadIndex === -1) {
      throw new Error("Invalid Cloudinary URL structure");
    }

    const publicIdWithVersion = fileUrl.slice(uploadIndex + 8);
    return publicIdWithVersion.replace(/^v\d+\//, "").replace(/\.[^/.]+$/, "");
  } catch (error) {
    return null;
  }
};

const deleteFromCloudinary = async (fileUrl, options = {}) => {
  const publicId = extractPublicIdFromUrl(fileUrl);
  if (!publicId) {
    return false;
  }

  const result = await cloudinary.uploader.destroy(publicId, options);
  return result.result === "ok" || result.result === "not found";
};

export { uploadOnCloudinary, deleteFromCloudinary, extractPublicIdFromUrl, cleanupLocalFile };
