const fs = require("fs/promises");
const cloudinary = require("../config/cloudinary");

const uploadMediaFromPath = async (filePath, options = {}) =>
  cloudinary.uploader.upload(filePath, {
    folder: options.folder || "movie-rental",
    resource_type: options.resourceType || "auto",
    overwrite: false,
  });

const deleteCloudinaryMedia = async (publicId, resourceType = "image") => {
  if (!publicId) {
    return null;
  }

  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

const removeTempFile = async (filePath) => {
  if (!filePath) {
    return;
  }

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
};

module.exports = {
  uploadMediaFromPath,
  deleteCloudinaryMedia,
  removeTempFile,
};
