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

  // Razorpay: amount in paise (₹49 → 4900), min ₹1 = 100 paise, receipt max 40 chars
  const amountPaise = Math.max(100, Math.round(Number(movie.price) * 100));
  const receipt = `m_${movie._id.toString().slice(-18)}_${String(Date.now()).slice(-8)}`;

  let order;
  try {
    order = await razorpayClient.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt,
      notes: {
        userId: req.user.id,
        movieId: movie._id.toString(),
      },
    });
  } catch (razorpayError) {
    const err = razorpayError?.error || razorpayError;
    const description = err?.description || razorpayError?.description || err?.message || razorpayError?.message;
    console.error("[Payment] Razorpay create order failed:", description || razorpayError);

    // "Merchant issue" often = Live keys used while testing (use rzp_test_* for test mode)
    let message = description || "Payment service is temporarily unavailable. Please try again.";
    if (
      String(message).toLowerCase().includes("merchant") ||
      String(message).toLowerCase().includes("issue with the merchant")
    ) {
      message =
        "Payment failed (merchant setup). For testing, use Razorpay TEST keys (rzp_test_...) in backend ENV. Live keys need an activated Razorpay account.";
    }
    throw new ApiError(503, message);
  }

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
      movieId: movie._id.toString(),
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
    console.error(`[Payment Verify Error] Signature mismatch - Expected: ${expectedSignature}, Got: ${razorpay_signature}`);
    throw new ApiError(400, "Invalid payment signature. Signature verification failed.");
  }

  const purchase = await Purchase.findOne({
    user: req.user.id,
    razorpayOrderId: razorpay_order_id,
  });

  if (!purchase) {
    console.error(`[Payment Verify Error] Purchase not found - Order: ${razorpay_order_id}, User: ${req.user.id}`);
    throw new ApiError(404, "Order not found for current user. Please contact support.");
  }

  if (purchase.status === "paid") {
    return res.status(200).json({
      success: true,
      message: "Payment already verified",
      data: {
        purchaseId: purchase._id,
        movieId: purchase.movie,
        accessExpiresAt: purchase.accessExpiresAt,
        watchLink: `/api/user/watch/${purchase.movie}`,
      },
    });
  }

  const existingPayment = await Purchase.findOne({
    razorpayPaymentId: razorpay_payment_id,
    status: "paid",
  });
  if (existingPayment) {
    console.warn(`[Payment Verify Warning] Duplicate payment attempt - Payment ID: ${razorpay_payment_id}`);
    throw new ApiError(409, "Duplicate payment detected for this payment ID.");
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

const getOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  if (!orderId) {
    throw new ApiError(400, "orderId is required");
  }

  const purchase = await Purchase.findOne({
    razorpayOrderId: orderId,
    user: req.user.id,
  });

  if (!purchase) {
    throw new ApiError(404, "Order not found");
  }

  res.status(200).json({
    success: true,
    message: "Order status retrieved",
    data: {
      orderId: purchase.razorpayOrderId,
      paymentId: purchase.razorpayPaymentId || null,
      status: purchase.status,
      amount: purchase.amount,
      currency: purchase.currency,
      paidAt: purchase.paidAt,
      accessExpiresAt: purchase.accessExpiresAt,
    },
  });
});

module.exports = { createOrder, verifyPayment, getOrderStatus };
