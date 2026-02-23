const Movie = require("../models/movie.model");
const Purchase = require("../models/purchase.model");
const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { getPagination } = require("../utils/pagination");
const { cache } = require("../services/cache.service");
const { parseActors } = require("../utils/parseActors");
const {
  uploadMediaFromPath,
  deleteCloudinaryMedia,
  removeTempFile,
} = require("../utils/cloudinaryMedia");
const Category = require("../models/category.model");
const Tag = require("../models/tag.model");
const {
  processVideoToHLS,
  cleanupHlsFolder,
} = require("../services/videoProcessing.service");

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
  category: movie.category ? { id: movie.category._id, name: movie.category.name } : null,
  tags: Array.isArray(movie.tags)
    ? movie.tags.map((t) => ({ id: t._id, name: t.name }))
    : [],
  ...(includeVideo
    ? {
        videoUrl: movie.videoFile?.url,
        videoPublicId: movie.videoFile?.publicId,
      }
    : {}),
  createdAt: movie.createdAt,
  updatedAt: movie.updatedAt,
});

const uploadMovie = asyncHandler(async (req, res) => {
  const { title, description, rating, actors, price, category, tags } = req.body;

  // basic validation
  if (!title || !description || typeof price === "undefined") {
    throw new ApiError(400, "title, description and price are required");
  }
  if (!req.files || !req.files.cover?.[0] || !req.files.video?.[0]) {
    throw new ApiError(400, "cover and video files are required");
  }

  const coverFile = req.files.cover[0];
  const videoFile = req.files.video[0];
  let uploadedCover = null;

  // validate category/tags if present
  let categoryId = null;
  if (category) {
    const cat = await Category.findById(category);
    if (!cat) {
      throw new ApiError(400, "Invalid category id");
    }
    categoryId = cat._id;
  }

  let tagIds = [];
  if (tags) {
    const arr = Array.isArray(tags) ? tags : [tags];
    const found = await Tag.find({ _id: { $in: arr } });
    if (found.length !== arr.length) {
      throw new ApiError(400, "One or more tags are invalid");
    }
    tagIds = found.map((t) => t._id);
  }

  // create movie document first to reserve an _id for HLS folder
  const movie = new Movie({
    title: String(title).trim(),
    description: String(description).trim(),
    rating: Number(rating || 0),
    actors: parseActors(actors),
    price: Number(price),
    coverImage: {}, // fill after upload
    createdBy: resolveCreatorId(req.user.id),
    category: categoryId,
    tags: tagIds,
  });

  try {
    // upload cover image
    uploadedCover = await uploadMediaFromPath(coverFile.path, {
      folder: "movie-rental/covers",
      resourceType: "image",
    });

    movie.coverImage = {
      url: uploadedCover.secure_url,
      publicId: uploadedCover.public_id,
      resourceType: "image",
    };

    // save initially (video/hls will be added after processing)
    await movie.save();

    // convert the original video to HLS and upload segments
    const { playlistUrl, folder } = await processVideoToHLS(videoFile.path, movie._id.toString());

    movie.hlsPlaylistUrl = playlistUrl;
    movie.hlsFolder = folder;
    await movie.save();

    cache.clearPrefix("movies:list");
    return res.status(201).json({
      success: true,
      message: "Movie uploaded successfully",
      data: toMovieResponse(movie, true),
    });
  } catch (error) {
    // rollback: remove cloudinary assets and database record if necessary
    if (uploadedCover?.public_id) {
      await deleteCloudinaryMedia(uploadedCover.public_id, "image");
    }
    if (movie && movie._id) {
      await Movie.deleteOne({ _id: movie._id }).catch(() => {});
      // also attempt to clean any partially uploaded hls files
      if (movie.hlsFolder) {
        await cleanupHlsFolder(movie.hlsFolder);
      }
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

  const { title, description, rating, actors, price, category, tags } = req.body;
  const coverFile = req.files?.cover?.[0];
  const videoFile = req.files?.video?.[0];

  const originalCoverPublicId = movie.coverImage?.publicId;
  let uploadedCover = null;

  try {
    if (typeof title !== "undefined") movie.title = String(title).trim();
    if (typeof description !== "undefined") movie.description = String(description).trim();
    if (typeof rating !== "undefined") movie.rating = Number(rating);
    if (typeof actors !== "undefined") movie.actors = parseActors(actors);
    if (typeof price !== "undefined") movie.price = Number(price);

    if (typeof category !== "undefined") {
      if (category) {
        const cat = await Category.findById(category);
        if (!cat) throw new ApiError(400, "Invalid category id");
        movie.category = cat._id;
      } else {
        movie.category = null;
      }
    }

    if (typeof tags !== "undefined") {
      const arr = Array.isArray(tags) ? tags : [tags];
      if (arr.length) {
        const found = await Tag.find({ _id: { $in: arr } });
        if (found.length !== arr.length) throw new ApiError(400, "One or more tags are invalid");
        movie.tags = arr;
      } else {
        movie.tags = [];
      }
    }

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
      // new video bump: remove old hls assets then reprocess
      if (movie.hlsFolder) {
        await cleanupHlsFolder(movie.hlsFolder);
        movie.hlsPlaylistUrl = null;
        movie.hlsFolder = null;
      }
      const { playlistUrl, folder } = await processVideoToHLS(videoFile.path, movie._id.toString());
      movie.hlsPlaylistUrl = playlistUrl;
      movie.hlsFolder = folder;
    }

    await movie.save();

    if (uploadedCover?.public_id && originalCoverPublicId && originalCoverPublicId !== uploadedCover.public_id) {
      await deleteCloudinaryMedia(originalCoverPublicId, "image");
    }

    cache.clearPrefix("movies:list");
    return res.status(200).json({
      success: true,
      message: "Movie updated successfully",
      data: toMovieResponse(movie, true),
    });
  } catch (error) {
    if (uploadedCover?.public_id) {
      await deleteCloudinaryMedia(uploadedCover.public_id, "image");
    }
    throw error;
  } finally {
    await Promise.allSettled([removeTempFile(coverFile?.path), removeTempFile(videoFile?.path)]);
  }
});

const getAllMovies = asyncHandler(async (req, res) => {
  const { currentPage, limit, skip } = getPagination(req.query.page, req.query.limit);

  const [totalItems, movies] = await Promise.all([
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

  return res.status(200).json({
    success: true,
    message: "All movies fetched",
    data: movies.map((movie) => toMovieResponse(movie, true)),
    meta: {
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / limit)),
      currentPage,
      limit,
    },
  });
});

const getMovieById = asyncHandler(async (req, res) => {
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
    data: toMovieResponse(movie, true),
  });
});

const getAllUsers = asyncHandler(async (req, res) => {
  const { currentPage, limit, skip } = getPagination(req.query.page, req.query.limit);

  const [totalItems, users] = await Promise.all([
    User.countDocuments(),
    User.find()
      .select("_id name email role isActive createdAt updatedAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return res.status(200).json({
    success: true,
    message: "All users fetched",
    data: users,
    meta: {
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / limit)),
      currentPage,
      limit,
    },
  });
});

const getAllPurchases = asyncHandler(async (req, res) => {
  const { currentPage, limit, skip } = getPagination(req.query.page, req.query.limit);

  const [totalItems, purchases] = await Promise.all([
    Purchase.countDocuments(),
    Purchase.find()
      .populate("user", "name email role")
      .populate("movie", "title price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  // map to admin-friendly response
  const mapped = purchases.map((p) => ({
    id: p._id,
    user: p.user ? { id: p.user._id, name: p.user.name, email: p.user.email } : null,
    movie: p.movie ? { id: p.movie._id, title: p.movie.title } : null,
    amount: (p.amount || 0) / 100,
    currency: p.currency,
    paymentStatus: p.status,
    purchaseDate: p.paidAt || p.createdAt,
    expiryDate: p.accessExpiresAt,
    razorpayOrderId: p.razorpayOrderId,
    razorpayPaymentId: p.razorpayPaymentId,
    createdAt: p.createdAt,
  }));

  return res.status(200).json({
    success: true,
    message: "All purchases fetched",
    data: mapped,
    meta: {
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / limit)),
      currentPage,
      limit,
    },
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
          totalRevenuePaise: { $sum: "$amount" },
          paidTransactions: { $sum: 1 },
        },
      },
    ]),
  ]);
  const revenue = paidSummary[0] || { totalRevenuePaise: 0, paidTransactions: 0 };

  // active / expired / failed counts
  const now = new Date();
  const [activeRentals, expiredRentals, failedPayments] = await Promise.all([
    Purchase.countDocuments({ status: "paid", accessExpiresAt: { $gt: now } }),
    Purchase.countDocuments({ $or: [ { status: "expired" }, { status: "paid", accessExpiresAt: { $lte: now } } ] }),
    Purchase.countDocuments({ status: "failed" }),
  ]);

  return res.status(200).json({
    success: true,
    message: "Dashboard overview fetched",
    data: {
      totalMovies: movieCount,
      totalUsers: userCount,
      totalPurchases: purchaseCount,
      totalRevenue: (Number(revenue.totalRevenuePaise || 0) / 100),
      paidTransactions: revenue.paidTransactions,
      activeRentals,
      expiredRentals,
      failedPayments,
    },
  });
});

const deleteMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.movieId);
  if (!movie) {
    throw new ApiError(404, "Movie not found");
  }

  const tasks = [
    deleteCloudinaryMedia(movie.coverImage?.publicId, "image"),
  ];
  if (movie.hlsFolder) {
    tasks.push(cleanupHlsFolder(movie.hlsFolder));
  }

  await Promise.allSettled(tasks);

  await Movie.deleteOne({ _id: movie._id });

  cache.clearPrefix("movies:list");
  return res.status(200).json({
    success: true,
    message: "Movie deleted successfully",
    data: null,
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
