const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
const os = require("os");
const crypto = require("crypto");
const { PassThrough } = require("stream");
const UploadSession = require("../models/uploadSession.model");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const cloudinary = require("../config/cloudinary");

const MAX_CHUNK_SIZE = 4 * 1024 * 1024 * 1024;
const SESSION_RETENTION_MS = 24 * 60 * 60 * 1000;
const FINALIZE_TIMEOUT_MS = 45 * 60 * 1000;
const UPLOAD_ROOT = path.join(os.tmpdir(), "uploads");

const toSessionResponse = (session) => ({
  sessionId: session.sessionId,
  movieId: session.movieId,
  fileName: session.fileName,
  totalSize: session.totalSize,
  totalChunks: session.totalChunks,
  uploadedChunks: [...session.uploadedChunks].sort((a, b) => a - b),
  status: session.status,
  cloudinaryPublicId: session.cloudinaryPublicId,
  cloudinaryUrl: session.cloudinaryUrl,
  createdAt: session.createdAt,
});

const getSessionDir = (sessionId) => path.join(UPLOAD_ROOT, sessionId);
const getChunkPath = (sessionId, chunkIndex) => path.join(getSessionDir(sessionId), `chunk_${chunkIndex}`);

const parsePositiveInt = (value, fieldName) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new ApiError(400, `${fieldName} must be a valid number`);
  }
  return parsed;
};

const assertSessionId = (sessionId) => {
  const normalized = String(sessionId || "").trim();
  if (!normalized || !/^[a-zA-Z0-9-_]{8,200}$/.test(normalized)) {
    throw new ApiError(400, "Invalid sessionId");
  }
  return normalized;
};

const safeUnlink = async (filePath) => {
  try {
    await fsp.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
};

const safeRmDir = async (dirPath) => {
  try {
    await fsp.rm(dirPath, { recursive: true, force: true });
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
};

const pipeChunkToStream = (chunkPath, targetStream) =>
  new Promise((resolve, reject) => {
    const source = fs.createReadStream(chunkPath);
    source.on("error", reject);
    source.on("end", resolve);
    source.pipe(targetStream, { end: false });
  });

const cleanupFailedSessions = async () => {
  const cutoff = new Date(Date.now() - SESSION_RETENTION_MS);
  const staleSessions = await UploadSession.find({
    status: "failed",
    createdAt: { $lt: cutoff },
  })
    .select("sessionId")
    .lean();

  if (!staleSessions.length) {
    return;
  }

  await Promise.all(staleSessions.map((item) => safeRmDir(getSessionDir(item.sessionId))));
  await UploadSession.deleteMany({
    sessionId: { $in: staleSessions.map((item) => item.sessionId) },
  });
};

const startUploadSession = asyncHandler(async (req, res) => {
  await cleanupFailedSessions();

  const sessionId = assertSessionId(req.body.sessionId);
  const fileName = String(req.body.fileName || "").trim();
  const totalSize = parsePositiveInt(req.body.totalSize, "totalSize");
  const totalChunks = parsePositiveInt(req.body.totalChunks, "totalChunks");
  const movieId = req.body.movieId || null;

  if (!fileName) {
    throw new ApiError(400, "fileName is required");
  }
  if (totalChunks < 1) {
    throw new ApiError(400, "totalChunks must be at least 1");
  }
  if (totalSize < 1) {
    throw new ApiError(400, "totalSize must be greater than 0");
  }

  const existing = await UploadSession.findOne({ sessionId });
  if (existing) {
    const mismatch =
      existing.fileName !== fileName ||
      existing.totalSize !== totalSize ||
      existing.totalChunks !== totalChunks;

    if (mismatch) {
      throw new ApiError(409, "Upload session metadata mismatch");
    }

    if (movieId && !existing.movieId) {
      existing.movieId = movieId;
      await existing.save();
    }

    return res.status(200).json({
      success: true,
      message: "Upload session restored",
      data: toSessionResponse(existing),
    });
  }

  const session = await UploadSession.create({
    sessionId,
    movieId,
    fileName,
    totalSize,
    totalChunks,
    uploadedChunks: [],
    status: "uploading",
  });

  return res.status(201).json({
    success: true,
    message: "Upload session started",
    data: toSessionResponse(session),
  });
});

const getUploadSession = asyncHandler(async (req, res) => {
  const sessionId = assertSessionId(req.params.sessionId);
  const session = await UploadSession.findOne({ sessionId });
  if (!session) {
    throw new ApiError(404, "Upload session not found");
  }

  return res.status(200).json({
    success: true,
    message: "Upload session fetched",
    data: toSessionResponse(session),
  });
});

const uploadChunk = asyncHandler(async (req, res) => {
  const sessionId = assertSessionId(req.body.sessionId);
  const chunkIndex = parsePositiveInt(req.body.chunkIndex, "chunkIndex");
  const totalChunks = parsePositiveInt(req.body.totalChunks, "totalChunks");
  const totalSize = parsePositiveInt(req.body.totalSize, "totalSize");
  const fileName = String(req.body.fileName || "").trim();
  const fileChunk = req.file;

  if (!fileChunk) {
    throw new ApiError(400, "fileChunk is required");
  }

  if (fileChunk.size > MAX_CHUNK_SIZE) {
    await safeUnlink(fileChunk.path);
    throw new ApiError(413, "Chunk exceeds max allowed size (4GB)");
  }

  if (chunkIndex < 0 || chunkIndex >= totalChunks) {
    await safeUnlink(fileChunk.path);
    throw new ApiError(400, "Invalid chunkIndex");
  }

  const session = await UploadSession.findOne({ sessionId });
  if (!session) {
    await safeUnlink(fileChunk.path);
    throw new ApiError(404, "Upload session not found");
  }

  const mismatch =
    session.totalChunks !== totalChunks ||
    session.totalSize !== totalSize ||
    session.fileName !== fileName;

  if (mismatch) {
    await safeUnlink(fileChunk.path);
    throw new ApiError(409, "Session mismatch for this chunk");
  }

  if (session.status === "completed") {
    await safeUnlink(fileChunk.path);
    throw new ApiError(409, "Upload already completed");
  }

  if (session.uploadedChunks.includes(chunkIndex)) {
    await safeUnlink(fileChunk.path);
    return res.status(200).json({
      success: true,
      message: "Chunk already uploaded",
      data: {
        sessionId,
        chunkIndex,
        uploadedChunks: [...session.uploadedChunks].sort((a, b) => a - b),
      },
    });
  }

  await fsp.mkdir(getSessionDir(sessionId), { recursive: true });

  const targetPath = getChunkPath(sessionId, chunkIndex);
  await fsp.rename(fileChunk.path, targetPath);

  session.uploadedChunks.push(chunkIndex);
  session.status = "uploading";
  await session.save();

  return res.status(200).json({
    success: true,
    message: "Chunk uploaded",
    data: {
      sessionId,
      chunkIndex,
      uploadedChunks: [...session.uploadedChunks].sort((a, b) => a - b),
      totalChunks: session.totalChunks,
      status: session.status,
    },
  });
});

const uploadToCloudinaryFromChunkStreams = async (session) => {
  const sessionId = session.sessionId;
  const streamInput = new PassThrough();

  const uploadPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      streamInput.destroy(new Error("Cloudinary upload timed out"));
    }, FINALIZE_TIMEOUT_MS);

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video",
        folder: "movie-rental/videos",
        public_id: `session_${sessionId}_${crypto.randomBytes(6).toString("hex")}`,
        use_large: true,
        chunk_size: 20 * 1024 * 1024,
        timeout: FINALIZE_TIMEOUT_MS,
      },
      (error, result) => {
        clearTimeout(timeout);
        if (error) {
          return reject(error);
        }
        return resolve(result);
      }
    );

    streamInput.pipe(uploadStream);
  });

  const mergePromise = (async () => {
    for (let index = 0; index < session.totalChunks; index += 1) {
      const chunkPath = getChunkPath(sessionId, index);
      await pipeChunkToStream(chunkPath, streamInput);
    }
    streamInput.end();
  })().catch((error) => {
    streamInput.destroy(error);
    throw error;
  });

  const [result] = await Promise.all([uploadPromise, mergePromise]);
  return result;
};

const finalizeUploadSession = asyncHandler(async (req, res) => {
  const sessionId = assertSessionId(req.params.sessionId);
  const session = await UploadSession.findOne({ sessionId });
  if (!session) {
    throw new ApiError(404, "Upload session not found");
  }

  if (session.status === "completed" && session.cloudinaryPublicId && session.cloudinaryUrl) {
    return res.status(200).json({
      success: true,
      message: "Upload already finalized",
      data: {
        sessionId: session.sessionId,
        status: session.status,
        cloudinaryPublicId: session.cloudinaryPublicId,
        videoUrl: session.cloudinaryUrl,
      },
    });
  }

  const uploadedSet = new Set(session.uploadedChunks);
  if (uploadedSet.size !== session.totalChunks) {
    throw new ApiError(400, "Not all chunks are uploaded");
  }

  for (let index = 0; index < session.totalChunks; index += 1) {
    const chunkPath = getChunkPath(sessionId, index);
    try {
      await fsp.access(chunkPath);
    } catch (error) {
      throw new ApiError(400, `Missing chunk ${index}`);
    }
  }

  session.status = "processing";
  await session.save();

  try {
    const uploadedVideo = await uploadToCloudinaryFromChunkStreams(session);
    session.status = "completed";
    session.cloudinaryPublicId = uploadedVideo.public_id;
    session.cloudinaryUrl = uploadedVideo.secure_url;
    await session.save();

    await safeRmDir(getSessionDir(sessionId));

    return res.status(200).json({
      success: true,
      message: "Upload finalized successfully",
      data: {
        sessionId: session.sessionId,
        status: session.status,
        cloudinaryPublicId: session.cloudinaryPublicId,
        videoUrl: session.cloudinaryUrl,
      },
    });
  } catch (error) {
    session.status = "failed";
    await session.save();
    throw new ApiError(500, error.message || "Failed to finalize upload");
  }
});

module.exports = {
  startUploadSession,
  getUploadSession,
  uploadChunk,
  finalizeUploadSession,
  cleanupFailedSessions,
};
