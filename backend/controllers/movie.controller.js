const Movie = require("../models/movie.model");
const Purchase = require("../models/purchase.model");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { getPagination, buildPaginationMeta } = require("../utils/pagination");
const { revokeExpiredAccess } = require("../utils/cleanupExpiredAccess");

const movieToPublicResponse = (movie) => ({
  id: movie._id,
  title: movie.title,
  description: movie.description,
  actors: movie.actors,
  rating: movie.rating,
  price: movie.price,
  coverImageUrl: movie.coverImage.url,
  createdAt: movie.createdAt,
  updatedAt: movie.updatedAt,
});

const ensureActiveAccess = async (userId, movieId) => {
  await revokeExpiredAccess();

  const movie = await Movie.findById(movieId);
  if (!movie) {
    throw new ApiError(404, "Movie not found");
  }

  const purchase = await Purchase.findOne({
    user: userId,
    movie: movie._id,
    status: "paid",
    accessExpiresAt: { $gt: new Date() },
  });

  if (!purchase) {
    throw new ApiError(403, "Movie access expired or not purchased");
  }

  return { movie, purchase };
};

const listMovies = asyncHandler(async (req, res) => {
  const { currentPage, limit, skip } = getPagination(req.query.page, req.query.limit);

  const [totalMovies, movies] = await Promise.all([
    Movie.countDocuments(),
    Movie.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);

  res.status(200).json({
    success: true,
    message: "Movies fetched successfully",
    data: {
      ...buildPaginationMeta(totalMovies, currentPage, limit),
      movies: movies.map(movieToPublicResponse),
    },
  });
});

const getMovieDetails = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.movieId);
  if (!movie) {
    throw new ApiError(404, "Movie not found");
  }

  res.status(200).json({
    success: true,
    message: "Movie details fetched",
    data: movieToPublicResponse(movie),
  });
});

const watchPurchasedMovie = asyncHandler(async (req, res) => {
  const { movie, purchase } = await ensureActiveAccess(req.user.id, req.params.movieId);

  res.status(200).json({
    success: true,
    message: "Watch access granted",
    data: {
      movie: movieToPublicResponse(movie),
      accessExpiresAt: purchase.accessExpiresAt,
      watchLink: movie.videoFile.url,
    },
  });
});

const streamPurchasedMovie = asyncHandler(async (req, res) => {
  const { movie } = await ensureActiveAccess(req.user.id, req.params.movieId);
  res.redirect(movie.videoFile.url);
});

module.exports = { listMovies, getMovieDetails, watchPurchasedMovie, streamPurchasedMovie };
