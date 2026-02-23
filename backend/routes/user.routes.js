const express = require("express");
const {
  getMyMovies,
  updateProfile,
  getTransactions,
} = require("../controllers/user.controller");
const { watchPurchasedMovie, streamPurchasedMovie } = require("../controllers/movie.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const { uploadAvatar } = require("../config/multer");
const router = express.Router();

router.use(authenticate, authorize("user"));

router.get("/my-movies", getMyMovies);
router.get("/watch/:movieId", watchPurchasedMovie);
router.get("/watch/:movieId/stream", streamPurchasedMovie);

// Profile update (avatar optional)
router.put("/profile", uploadAvatar, updateProfile);
router.get("/transactions", getTransactions);

module.exports = router;
