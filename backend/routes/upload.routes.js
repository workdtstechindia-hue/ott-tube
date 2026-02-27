const express = require("express");
const {
  startUploadSession,
  getUploadSession,
  uploadChunk,
  finalizeUploadSession,
} = require("../controllers/upload.controller");
const { uploadVideoChunk } = require("../config/multer");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");

const router = express.Router();

router.use(authenticate, authorize("admin"));
router.use((req, res, next) => {
  req.setTimeout(60 * 60 * 1000);
  res.setTimeout(60 * 60 * 1000);
  next();
});

router.post("/session/start", startUploadSession);
router.get("/session/:sessionId", getUploadSession);
router.post("/chunk", uploadVideoChunk, uploadChunk);
router.post("/session/:sessionId/finalize", finalizeUploadSession);

module.exports = router;
