const express = require("express");
const {
  uploadMovie,
  getAllMovies,
  getMovieById,
  getAllUsers,
  getAllPurchases,
  getDashboardOverview,
  updateMovie,
  deleteMovie,
} = require("../controllers/admin.controller");
const { uploadMovieAssets } = require("../config/multer");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const { validatePaginationQuery } = require("../validators/pagination.validators");

const router = express.Router();

router.use(authenticate, authorize("admin"));

router.get("/dashboard/overview", getDashboardOverview);
router.get("/movies", validatePaginationQuery, getAllMovies);
router.get("/movies/:movieId", getMovieById);
router.get("/users", validatePaginationQuery, getAllUsers);
router.get("/purchases", validatePaginationQuery, getAllPurchases);
router.post("/movies", uploadMovieAssets, uploadMovie);
router.put("/movies/:movieId", uploadMovieAssets, updateMovie);
router.delete("/movies/:movieId", deleteMovie);

module.exports = router;
