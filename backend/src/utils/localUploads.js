import fs from "fs";
import path from "path";

const publicDirectory = path.resolve(process.cwd(), "public");
const uploadsDirectory = path.join(publicDirectory, "uploads");

const ensureDirectory = (directoryPath) => {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
};

const buildPublicUrl = (req, relativePath) => {
  const normalizedPath = relativePath.split(path.sep).join("/");
  return `${req.protocol}://${req.get("host")}/${normalizedPath}`;
};

const persistLocalUpload = (localFilePath, folderName, req) => {
  if (!localFilePath || !fs.existsSync(localFilePath)) {
    return null;
  }

  const targetDirectory = path.join(uploadsDirectory, folderName);
  ensureDirectory(targetDirectory);

  const fileExtension = path.extname(localFilePath).toLowerCase();
  const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
  const targetPath = path.join(targetDirectory, fileName);

  fs.renameSync(localFilePath, targetPath);

  return {
    provider: "local",
    secure_url: buildPublicUrl(req, path.join("uploads", folderName, fileName)),
  };
};

const isLocalAssetUrl = (fileUrl) => typeof fileUrl === "string" && fileUrl.includes("/uploads/");

const deleteLocalAsset = (fileUrl) => {
  try {
    if (!isLocalAssetUrl(fileUrl)) {
      return false;
    }

    const pathname = fileUrl.startsWith("http") ? new URL(fileUrl).pathname : fileUrl;
    const relativePath = decodeURIComponent(pathname).replace(/^\/+/, "");
    const absolutePath = path.normalize(path.join(publicDirectory, relativePath));

    if (!absolutePath.startsWith(publicDirectory)) {
      return false;
    }

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    return true;
  } catch {
    return false;
  }
};

export { persistLocalUpload, deleteLocalAsset, isLocalAssetUrl };
