const crypto = require("crypto");
const razorpayClient = require("../config/razorpay");
const Movie = require("../models/movie.model");
const Purchase = require("../models/purchase.model");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { calculateExpiryDate } = require("../utils/calculateExpiry");
const env = require("../config/env");

const createOrder = asyncHandler(async (req, res) => {
  // allow creation by movieId (preferred) or by explicit amount
  const { movieId, amount } = req.body;
  let movie = null;

  if (movieId) {
    movie = await Movie.findById(movieId);
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
  }

  // amount in rupees must be present either via movie or body
  let rupees;
  if (movie) {
    rupees = Number(movie.price);
  } else if (typeof amount !== "undefined") {
    rupees = Number(amount);
  }

  if (isNaN(rupees) || rupees <= 0) {
    throw new ApiError(400, "Valid amount or movieId must be provided");
  }

  // convert to paise, enforce minimum
  const amountPaise = Math.max(100, Math.round(rupees * 100));
  const receipt = `o_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  let order;
  try {
    order = await razorpayClient.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt,
      notes: {
        userId: req.user.id,
        movieId: movie ? movie._id.toString() : null,
      },
    });
    console.log(`[Payment] created razorpay order ${order.id} for user ${req.user.id}`);
  } catch (razorpayError) {
    const err = razorpayError?.error || razorpayError;
    const description =
      err?.description || razorpayError?.description || err?.message || razorpayError?.message;
    console.error("[Payment] Razorpay create order failed:", description || razorpayError);

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

  // store amount in paise for precision
  await Purchase.create({
    user: req.user.id,
    movie: movie ? movie._id : null,
    amount: amountPaise,
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
      movieId: movie ? movie._id.toString() : undefined,
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

  // atomic update to avoid races
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
      amount: (purchase.amount || 0) / 100,
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
      amount: (purchase.amount || 0) / 100,
      currency: purchase.currency,
      paidAt: purchase.paidAt,
      accessExpiresAt: purchase.accessExpiresAt,
    },
  });
});


// webhook handler for Razorpay events
const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const body = req.rawBody || JSON.stringify(req.body);

  if (!signature) {
    console.error("[Webhook] missing signature header");
    return res.status(400).json({ success: false, message: "Signature header missing" });
  }

  const expected = crypto
    .createHmac("sha256", env.razorpayWebhookSecret || "")
    .update(body)
    .digest("hex");

  if (expected !== signature) {
    console.error("[Webhook] signature mismatch", { expected, received: signature });
    return res.status(400).json({ success: false, message: "Invalid webhook signature" });
  }

  const event = req.body.event;
  const payload = req.body.payload || {};

  console.log("[Webhook] event received", event);

  // handle relevant events
  if (event === "payment.captured") {
    const payment = payload.payment.entity;
    try {
      const purchase = await Purchase.findOne({ razorpayOrderId: payment.order_id });
      if (purchase && purchase.status !== "paid") {
        purchase.razorpayPaymentId = payment.id;
        purchase.status = "paid";
        purchase.paidAt = new Date(payment.created_at * 1000);
        purchase.accessExpiresAt = calculateExpiryDate();
        await purchase.save();
        console.log("[Webhook] marked purchase paid", purchase._id);
      }
    } catch (err) {
      console.error("[Webhook] error updating payment.captured", err);
    }
  } else if (event === "payment.failed") {
    const payment = payload.payment.entity;
    try {
      const purchase = await Purchase.findOne({ razorpayOrderId: payment.order_id });
      if (purchase && purchase.status !== "failed") {
        purchase.status = "failed";
        await purchase.save();
        console.log("[Webhook] marked purchase failed", purchase._id);
      }
    } catch (err) {
      console.error("[Webhook] error updating payment.failed", err);
    }
  }

  res.status(200).json({ success: true });
});

module.exports = { createOrder, verifyPayment, getOrderStatus, handleWebhook };
