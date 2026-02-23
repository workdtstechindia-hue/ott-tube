const path = require("path");
const dotenv = require("dotenv");

// Always resolve backend/.env regardless of where the process is started.
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const requiredKeys = [
  "MONGO_URI",
  "JWT_SECRET",
];

const missing = requiredKeys.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
}

if ((process.env.NODE_ENV || "development") !== "production") {
  // log masked razorpay key ID for local debugging only
  const maskKey = (str = "") => str.replace(/.(?=.{4})/g, "*");
  console.log("[Env] Razorpay Key ID:", maskKey(process.env.RAZORPAY_KEY_ID || ""));
  console.log("[Env] Frontend URL:", process.env.FRONTEND_URL || "<not set>");
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  rentalDurationDays: Math.max(1, Number(process.env.RENTAL_DURATION_DAYS) || 30),
  razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
  frontendUrl: process.env.FRONTEND_URL,
  corsOrigins: (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
  adminEmail: process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.trim().toLowerCase() : "",
  adminPassword: process.env.ADMIN_PASSWORD || "",
  adminName: process.env.ADMIN_NAME || "System Admin",
  maxUploadSizeMb: Math.max(10, Number(process.env.MAX_UPLOAD_SIZE_MB) || 500),
  appBaseUrl: process.env.APP_BASE_URL || `http://localhost:${Number(process.env.PORT) || 5000}`,
};
