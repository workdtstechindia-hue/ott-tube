const Purchase = require("../models/purchase.model");
const User = require("../models/user.model");
const asyncHandler = require("../utils/asyncHandler");
const { revokeExpiredAccess } = require("../utils/cleanupExpiredAccess");
const { uploadMediaFromPath, removeTempFile } = require("../utils/cloudinaryMedia");
const ApiError = require("../utils/ApiError");
const env = require("../config/env");
const path = require("path");
const fs = require("fs/promises");

const getMyMovies = asyncHandler(async (req, res) => {
  await revokeExpiredAccess();

  const purchases = await Purchase.find({
    user: req.user.id,
    status: "paid",
    accessExpiresAt: { $gt: new Date() },
  })
    .populate("movie", "title description actors rating price coverImage")
    .sort({ paidAt: -1 });

  const movies = purchases.map((purchase) => ({
    movieId: purchase.movie._id,
    title: purchase.movie.title,
    description: purchase.movie.description,
    actors: purchase.movie.actors,
    rating: purchase.movie.rating,
    price: (purchase.movie.price || 0),
    coverImageUrl: purchase.movie.coverImage?.url,
    purchasedAt: purchase.paidAt,
    expiryDate: purchase.accessExpiresAt,
    status: purchase.status === "paid" && purchase.accessExpiresAt > new Date() ? "Active" : "Expired",
    watchLink: `/api/user/watch/${purchase.movie._id}`,
  }));

  res.status(200).json({
    success: true,
    message: "Purchased movies fetched successfully",
    data: movies,
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  // Payload validation
  const { username, email, phone, bio } = req.body || {};

  if (!username || !String(username).trim()) {
    throw new ApiError(400, "username is required");
  }

  if (email) {
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(String(email).trim().toLowerCase())) {
      throw new ApiError(400, "invalid email format");
    }
  }

  if (phone && !/^\+?[0-9\- ]{6,20}$/.test(String(phone))) {
    throw new ApiError(400, "invalid phone format");
  }

  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, "User not found");

  // avoid duplicate email
  if (email && email.toLowerCase() !== user.email) {
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) throw new ApiError(409, "Email already in use");
  }

  // handle avatar upload if present (multer saved file to req.file.path)
  if (req.file && req.file.path) {
    try {
      const uploaded = await uploadMediaFromPath(req.file.path, {
        folder: `movie-rental/avatars/${req.user.id}`,
        resourceType: "image",
      });
      user.avatar = uploaded.secure_url;
      // remove temp file
      await removeTempFile(req.file.path);
    } catch (err) {
      // cleanup temp file
      await removeTempFile(req.file?.path).catch(() => {});
      throw err;
    }
  }

  user.username = String(username).trim();
  if (email) user.email = String(email).trim().toLowerCase();
  if (typeof phone !== "undefined") user.phone = String(phone).trim();
  if (typeof bio !== "undefined") user.bio = String(bio).trim();

  await user.save();

  const safe = {
    id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    bio: user.bio,
    avatar: user.avatar,
    role: user.role,
  };

  res.status(200).json({ success: true, message: "Profile updated", data: safe });
});

const getTransactions = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Purchase.find({ user: req.user.id })
      .populate("movie", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Purchase.countDocuments({ user: req.user.id }),
  ]);

  const data = items.map((p) => ({
    orderId: p.razorpayOrderId,
    paymentId: p.razorpayPaymentId,
    movieTitle: p.movie?.title,
    amount: (p.amount || 0) / 100,
    status: p.status,
    createdAt: p.createdAt,
    purchaseDate: p.paidAt,
    expiryDate: p.accessExpiresAt,
  }));

  res.status(200).json({ success: true, message: "Transactions fetched", data, meta: { page, limit, total } });
});

module.exports = { getMyMovies, updateProfile, getTransactions };
