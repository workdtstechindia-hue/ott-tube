const Movie = require("../models/movie.model");
const Purchase = require("../models/purchase.model");
const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { parseActors } = require("../utils/parseActors");
const {
  uploadMediaFromPath,
  deleteCloudinaryMedia,
  removeTempFile,
} = require("../utils/cloudinaryMedia");

const SYSTEM_ADMIN_OBJECT_ID = "000000000000000000000001";
const resolveCreatorId = (reqUserId) => (reqUserId === "admin" ? SYSTEM_ADMIN_OBJECT_ID : reqUserId);

const toMovieResponse = (movie, includeVideo = false) => ({
  id: movie._id,
  title: movie.title,
  description: movie.description,
  actors: movie.actors,
  rating: movie.rating,
  price: movie.price,
  coverImageUrl: movie.coverImage.url,
  coverImagePublicId: movie.coverImage.publicId,
  ...(includeVideo
    ? {
        videoUrl: movie.videoFile.url,
        videoPublicId: movie.videoFile.publicId,
      }
    : {}),
  createdAt: movie.createdAt,
  updatedAt: movie.updatedAt,
});

const uploadMovie = asyncHandler(async (req, res) => {
  const { title, description, rating, actors, price } = req.body;

  if (!title || !description || typeof price === "undefined") {
    throw new ApiError(400, "title, description and price are required");
  }

  if (!req.files || !req.files.cover?.[0] || !req.files.video?.[0]) {
    throw new ApiError(400, "cover and video files are required");
  }

  const coverFile = req.files.cover[0];
  const videoFile = req.files.video[0];
  let uploadedCover = null;
  let uploadedVideo = null;

  try {
    uploadedCover = await uploadMediaFromPath(coverFile.path, {
      folder: "movie-rental/covers",
      resourceType: "image",
    });
    uploadedVideo = await uploadMediaFromPath(videoFile.path, {
      folder: "movie-rental/videos",
      resourceType: "video",
    });

    const movie = await Movie.create({
      title: String(title).trim(),
      description: String(description).trim(),
      rating: Number(rating || 0),
      actors: parseActors(actors),
      price: Number(price),
      coverImage: {
        url: uploadedCover.secure_url,
        publicId: uploadedCover.public_id,
        resourceType: "image",
      },
      videoFile: {
        url: uploadedVideo.secure_url,
        publicId: uploadedVideo.public_id,
        resourceType: "video",
      },
      createdBy: resolveCreatorId(req.user.id),
    });

    res.status(201).json({
      success: true,
      message: "Movie uploaded successfully",
      data: toMovieResponse(movie, true),
    });
  } catch (error) {
    if (uploadedCover?.public_id) {
      await deleteCloudinaryMedia(uploadedCover.public_id, "image");
    }
    if (uploadedVideo?.public_id) {
      await deleteCloudinaryMedia(uploadedVideo.public_id, "video");
    }
    throw error;
  } finally {
    await Promise.allSettled([removeTempFile(coverFile.path), removeTempFile(videoFile.path)]);
  }
});

const updateMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.movieId);
  if (!movie) {
    throw new ApiError(404, "Movie not found");
  }

  const { title, description, rating, actors, price } = req.body;
  const coverFile = req.files?.cover?.[0];
  const videoFile = req.files?.video?.[0];

  const originalCoverPublicId = movie.coverImage?.publicId;
  const originalVideoPublicId = movie.videoFile?.publicId;
  let uploadedCover = null;
  let uploadedVideo = null;

  try {
    if (typeof title !== "undefined") movie.title = String(title).trim();
    if (typeof description !== "undefined") movie.description = String(description).trim();
    if (typeof rating !== "undefined") movie.rating = Number(rating);
    if (typeof actors !== "undefined") movie.actors = parseActors(actors);
    if (typeof price !== "undefined") movie.price = Number(price);

    if (coverFile) {
      uploadedCover = await uploadMediaFromPath(coverFile.path, {
        folder: "movie-rental/covers",
        resourceType: "image",
      });
      movie.coverImage = {
        url: uploadedCover.secure_url,
        publicId: uploadedCover.public_id,
        resourceType: "image",
      };
    }

    if (videoFile) {
      uploadedVideo = await uploadMediaFromPath(videoFile.path, {
        folder: "movie-rental/videos",
        resourceType: "video",
      });
      movie.videoFile = {
        url: uploadedVideo.secure_url,
        publicId: uploadedVideo.public_id,
        resourceType: "video",
      };
    }

    await movie.save();

    if (uploadedCover?.public_id && originalCoverPublicId && originalCoverPublicId !== uploadedCover.public_id) {
      await deleteCloudinaryMedia(originalCoverPublicId, "image");
    }
    if (uploadedVideo?.public_id && originalVideoPublicId && originalVideoPublicId !== uploadedVideo.public_id) {
      await deleteCloudinaryMedia(originalVideoPublicId, "video");
    }

    res.status(200).json({
      success: true,
      message: "Movie updated successfully",
      data: toMovieResponse(movie, true),
    });
  } catch (error) {
    if (uploadedCover?.public_id) {
      await deleteCloudinaryMedia(uploadedCover.public_id, "image");
    }
    if (uploadedVideo?.public_id) {
      await deleteCloudinaryMedia(uploadedVideo.public_id, "video");
    }
    throw error;
  } finally {
    await Promise.allSettled([removeTempFile(coverFile?.path), removeTempFile(videoFile?.path)]);
  }
});

const getAllMovies = asyncHandler(async (req, res) => {
  const movies = await Movie.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: "All movies fetched",
    data: movies.map((movie) => toMovieResponse(movie, true)),
  });
});

const getMovieById = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.movieId);
  if (!movie) {
    throw new ApiError(404, "Movie not found");
  }

  res.status(200).json({
    success: true,
    message: "Movie details fetched",
    data: toMovieResponse(movie, true),
  });
});

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("_id name email role isActive createdAt").sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: "All users fetched",
    data: users,
  });
});

const getAllPurchases = asyncHandler(async (req, res) => {
  const purchases = await Purchase.find()
    .populate("user", "name email role")
    .populate("movie", "title price")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: "All purchases fetched",
    data: purchases,
  });
});

const getDashboardOverview = asyncHandler(async (req, res) => {
  const [movieCount, userCount, purchaseCount, paidSummary] = await Promise.all([
    Movie.countDocuments(),
    User.countDocuments({ role: "user" }),
    Purchase.countDocuments(),
    Purchase.aggregate([
      { $match: { status: "paid" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          paidTransactions: { $sum: 1 },
        },
      },
    ]),
  ]);

  const revenue = paidSummary[0] || { totalRevenue: 0, paidTransactions: 0 };

  res.status(200).json({
    success: true,
    message: "Dashboard overview fetched",
    data: {
      totalMovies: movieCount,
      totalUsers: userCount,
      totalPurchases: purchaseCount,
      totalRevenue: revenue.totalRevenue,
      paidTransactions: revenue.paidTransactions,
    },
  });
});

const deleteMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.movieId);
  if (!movie) {
    throw new ApiError(404, "Movie not found");
  }

  await Promise.allSettled([
    deleteCloudinaryMedia(movie.coverImage?.publicId, "image"),
    deleteCloudinaryMedia(movie.videoFile?.publicId, "video"),
  ]);

  await Movie.deleteOne({ _id: movie._id });

  res.status(200).json({
    success: true,
    message: "Movie deleted successfully",
  });
});

module.exports = {
  uploadMovie,
  getAllMovies,
  getMovieById,
  getAllUsers,
  getAllPurchases,
  getDashboardOverview,
  updateMovie,
  deleteMovie,
};
