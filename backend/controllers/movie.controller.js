const Movie = require("../models/movie.model");
const Purchase = require("../models/purchase.model");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { getPagination, buildPaginationMeta } = require("../utils/pagination");
const { revokeExpiredAccess } = require("../utils/cleanupExpiredAccess");
const { cache } = require("../services/cache.service");

const movieToPublicResponse = (movie) => ({
  id: movie._id,
  title: movie.title,
  description: movie.description,
  actors: movie.actors,
  rating: movie.rating,
  price: movie.price,
  coverImageUrl: movie.coverImage.url,
  category: movie.category ? { id: movie.category._id, name: movie.category.name } : null,
  tags: Array.isArray(movie.tags)
    ? movie.tags.map((t) => ({ id: t._id, name: t.name }))
    : [],
  createdAt: movie.createdAt,
  updatedAt: movie.updatedAt,
});

const ensureActiveAccess = async (userId, movieId) => {
  await revokeExpiredAccess();

  const movie = await Movie.findById(movieId).populate("category", "name").populate("tags", "name").lean();
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

  const cacheKey = `movies:list:${currentPage}:${limit}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.status(200).json(cached);
  }

  const [totalMovies, movies] = await Promise.all([
    Movie.countDocuments(),
    Movie.find()
      .select("-__v")
      .populate("category", "name")
      .populate("tags", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const responsePayload = {
    success: true,
    message: "Movies fetched successfully",
    data: {
      ...buildPaginationMeta(totalMovies, currentPage, limit),
      movies: movies.map(movieToPublicResponse),
    },
  };

  cache.set(cacheKey, responsePayload, 30 * 1000);

  return res.status(200).json(responsePayload);
});

const getMovieDetails = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.movieId)
    .select("-__v")
    .populate("category", "name")
    .populate("tags", "name")
    .lean();
  if (!movie) {
    throw new ApiError(404, "Movie not found");
  }

  return res.status(200).json({
    success: true,
    message: "Movie details fetched",
    data: movieToPublicResponse(movie),
  });
});

// legacy endpoint that returned direct video link (kept for backward compatibility)
const watchPurchasedMovie = asyncHandler(async (req, res) => {
  const { movie, purchase } = await ensureActiveAccess(req.user.id, req.params.movieId);

  return res.status(200).json({
    success: true,
    message: "Watch access granted",
    data: {
      movie: movieToPublicResponse(movie),
      accessExpiresAt: purchase.accessExpiresAt,
      watchLink: movie.videoFile?.url || null,
      hlsPlaylistUrl: movie.hlsPlaylistUrl || null,
    },
  });
});

// new streaming endpoint returns HLS playlist URL after verifying purchase
const streamPurchasedMovie = asyncHandler(async (req, res) => {
  const { movie } = await ensureActiveAccess(req.user.id, req.params.movieId);
  if (!movie.hlsPlaylistUrl) {
    throw new ApiError(404, "Stream not available");
  }
  return res.status(200).json({
    success: true,
    message: "Stream URL fetched",
    data: { hlsPlaylistUrl: movie.hlsPlaylistUrl },
  });
});

module.exports = { listMovies, getMovieDetails, watchPurchasedMovie, streamPurchasedMovie };
