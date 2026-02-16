const express = require("express");
const { getMyMovies } = require("../controllers/user.controller");
const { watchPurchasedMovie, streamPurchasedMovie } = require("../controllers/movie.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");

const router = express.Router();

router.use(authenticate, authorize("user"));

router.get("/my-movies", getMyMovies);
router.get("/watch/:movieId", watchPurchasedMovie);
router.get("/watch/:movieId/stream", streamPurchasedMovie);

module.exports = router;
