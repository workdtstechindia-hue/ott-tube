const Purchase = require("../models/purchase.model");
const asyncHandler = require("../utils/asyncHandler");
const { revokeExpiredAccess } = require("../utils/cleanupExpiredAccess");

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
    price: purchase.movie.price,
    coverImageUrl: purchase.movie.coverImage.url,
    purchasedAt: purchase.paidAt,
    expiryDate: purchase.accessExpiresAt,
    watchLink: `/api/user/watch/${purchase.movie._id}`,
  }));

  res.status(200).json({
    success: true,
    message: "Purchased movies fetched successfully",
    data: movies,
  });
});

module.exports = { getMyMovies };
