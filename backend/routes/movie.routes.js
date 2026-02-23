const express = require("express");
const {
  listMovies,
  getMovieDetails,
  streamPurchasedMovie,
  watchPurchasedMovie,
} = require("../controllers/movie.controller");
const { uploadMovie, updateMovie } = require("../controllers/admin.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const { uploadMovieAssets } = require("../config/multer");
const { validatePaginationQuery } = require("../validators/pagination.validators");

const router = express.Router();

router.get("/", validatePaginationQuery, listMovies);
router.get("/:movieId", getMovieDetails);

// allow admins to upload via public path (mirrors /api/admin/movies)
router.post(
  "/upload",
  authenticate,
  authorize("admin"),
  uploadMovieAssets,
  uploadMovie
);

// streaming routes require authentication and purchase check inside controller
router.get("/:movieId/stream", authenticate, streamPurchasedMovie);
// legacy endpoint, kept for compatibility
router.get("/:movieId/watch", authenticate, watchPurchasedMovie);

module.exports = router;
