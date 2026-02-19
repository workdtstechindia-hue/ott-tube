const fs = require("fs/promises");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const { uploadMediaFromPath } = require("../utils/cloudinaryMedia");
const cloudinary = require("../config/cloudinary");

// convert an arbitrary video file into HLS segments and playlist
// returns { playlistUrl, folder }
async function processVideoToHLS(inputPath, movieId) {
  const outputDir = path.join(process.cwd(), "uploads", "hls", movieId);
  await fs.mkdir(outputDir, { recursive: true });

  const playlistName = "playlist.m3u8";
  const playlistPath = path.join(outputDir, playlistName);

  await new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        "-hls_time 10",
        "-hls_playlist_type vod",
        `-hls_segment_filename ${path.join(outputDir, "segment_%03d.ts")}`,
      ])
      .output(playlistPath)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });

  // upload playlist first to capture url
  const playlistUpload = await uploadMediaFromPath(playlistPath, {
    folder: `movie-rental/hls/${movieId}`,
    resourceType: "video",
    public_id: "playlist",
    overwrite: true,
  });

  // upload segments (may be many)
  const files = await fs.readdir(outputDir);
  const segmentFiles = files.filter((f) => f.endsWith(".ts"));
  const uploadPromises = segmentFiles.map((fileName) => {
    const filePath = path.join(outputDir, fileName);
    return uploadMediaFromPath(filePath, {
      folder: `movie-rental/hls/${movieId}`,
      resourceType: "video",
      public_id: path.basename(fileName, path.extname(fileName)),
      overwrite: true,
    });
  });

  await Promise.all(uploadPromises);

  return {
    playlistUrl: playlistUpload.secure_url,
    folder: `movie-rental/hls/${movieId}`,
  };
}

// remove all HLS files stored under a folder prefix
async function cleanupHlsFolder(folder) {
  if (!folder) return;
  try {
    await cloudinary.api.delete_resources_by_prefix(folder, { resource_type: "video" });
  } catch (err) {
    console.error("cleanupHlsFolder error", err.message || err);
  }
}

module.exports = { processVideoToHLS, cleanupHlsFolder };
