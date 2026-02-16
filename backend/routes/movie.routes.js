const express = require("express");
const { listMovies, getMovieDetails } = require("../controllers/movie.controller");

const router = express.Router();

router.get("/", listMovies);
router.get("/:movieId", getMovieDetails);

module.exports = router;
