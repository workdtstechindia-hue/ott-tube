const crypto = require("crypto");
const razorpayClient = require("../config/razorpay");
const Movie = require("../models/movie.model");
const Purchase = require("../models/purchase.model");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { calculateExpiryDate } = require("../utils/calculateExpiry");
const env = require("../config/env");

const createOrder = asyncHandler(async (req, res) => {
  const { movieId } = req.body;
  if (!movieId) {
    throw new ApiError(400, "movieId is required");
  }

  const movie = await Movie.findById(movieId);
  if (!movie) {
    throw new ApiError(404, "Movie not found");
  }

  const activePurchase = await Purchase.findOne({
    user: req.user.id,
    movie: movie._id,
    status: "paid",
    accessExpiresAt: { $gt: new Date() },
  });

  if (activePurchase) {
    throw new ApiError(409, "You already rented this movie and your access is still active");
  }

  const order = await razorpayClient.orders.create({
    amount: Math.round(movie.price * 100),
    currency: "INR",
    receipt: `movie_${movie._id}_${Date.now()}`,
    notes: {
      userId: req.user.id,
      movieId: movie._id.toString(),
    },
  });

  await Purchase.create({
    user: req.user.id,
    movie: movie._id,
    amount: movie.price,
    currency: "INR",
    razorpayOrderId: order.id,
    status: "pending",
  });

  res.status(201).json({
    success: true,
    message: "Razorpay order created",
    data: {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: env.razorpayKeyId,
      movieId: movie._id,
    },
  });
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(400, "razorpay_order_id, razorpay_payment_id, razorpay_signature are required");
  }

  const signatureBody = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", env.razorpayKeySecret)
    .update(signatureBody)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, "Invalid payment signature");
  }

  const purchase = await Purchase.findOne({
    user: req.user.id,
    razorpayOrderId: razorpay_order_id,
  });

  if (!purchase) {
    throw new ApiError(404, "Order not found for current user");
  }

  if (purchase.status === "paid") {
    throw new ApiError(409, "Payment already verified for this order");
  }

  const existingPayment = await Purchase.findOne({
    razorpayPaymentId: razorpay_payment_id,
    status: "paid",
  });
  if (existingPayment) {
    throw new ApiError(409, "Duplicate payment detected");
  }

  purchase.razorpayPaymentId = razorpay_payment_id;
  purchase.razorpaySignature = razorpay_signature;
  purchase.status = "paid";
  purchase.paidAt = new Date();
  purchase.accessExpiresAt = calculateExpiryDate();

  await purchase.save();

  res.status(200).json({
    success: true,
    message: "Payment verified successfully",
    data: {
      purchaseId: purchase._id,
      movieId: purchase.movie,
      accessExpiresAt: purchase.accessExpiresAt,
      watchLink: `/api/user/watch/${purchase.movie}`,
    },
  });
});

module.exports = { createOrder, verifyPayment };
