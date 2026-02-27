const path = require("path");
const multer = require("multer");
const fs = require("fs");
const os = require("os");
const env = require("./env");
const ApiError = require("../utils/ApiError");

const tempDir = path.join(process.cwd(), "uploads", "tmp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const imageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const videoMimeTypes = new Set(["video/mp4", "video/webm", "video/quicktime", "video/x-matroska"]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tempDir),
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const safeBase = path
      .basename(file.originalname || "file", extension)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .slice(0, 60);
    const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    cb(null, `${safeBase || "file"}-${suffix}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "cover" && imageMimeTypes.has(file.mimetype)) {
    return cb(null, true);
  }

  if (file.fieldname === "video" && videoMimeTypes.has(file.mimetype)) {
    return cb(null, true);
  }

  return cb(new ApiError(400, `Invalid file type for ${file.fieldname}`));
};

const uploadMovieAssets = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.maxUploadSizeMb * 1024 * 1024,
  },
}).fields([
  { name: "cover", maxCount: 1 },
  { name: "video", maxCount: 1 },
]);

const chunkRootDir = path.join(os.tmpdir(), "uploads");
const MAX_CHUNK_SIZE = 100 * 1024 * 1024;

const chunkStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const sessionId = String(req.body?.sessionId || "").trim();
      if (!sessionId || !/^[a-zA-Z0-9-_]{8,200}$/.test(sessionId)) {
        return cb(new ApiError(400, "Invalid sessionId"));
      }

      const dir = path.join(chunkRootDir, sessionId);
      fs.mkdirSync(dir, { recursive: true });
      return cb(null, dir);
    } catch (error) {
      return cb(error);
    }
  },
  filename: (req, file, cb) => {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `incoming-${suffix}.part`);
  },
});

const uploadVideoChunk = multer({
  storage: chunkStorage,
  limits: {
    fileSize: MAX_CHUNK_SIZE,
    files: 1,
  },
}).single("fileChunk");

module.exports = { uploadMovieAssets, uploadVideoChunk };

// simple avatar upload middleware (single image)
const uploadAvatar = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const imageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (imageMimeTypes.has(file.mimetype)) return cb(null, true);
    return cb(new ApiError(400, "Invalid avatar file type"));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("avatar");

module.exports.uploadAvatar = uploadAvatar;
