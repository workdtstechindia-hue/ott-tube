const { cleanupFailedSessions } = require("../controllers/upload.controller");

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

const startUploadSessionCleanupJob = () => {
  setInterval(async () => {
    try {
      await cleanupFailedSessions();
    } catch (error) {
      console.error("Upload session cleanup failed:", error.message || error);
    }
  }, CLEANUP_INTERVAL_MS).unref();
};

module.exports = { startUploadSessionCleanupJob };
