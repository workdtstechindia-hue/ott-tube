const express = require("express");
const cors = require("cors");
const env = require("./config/env");
const { requestLogger } = require("./middlewares/logger.middleware");
const {
  mongoSanitize,
  xssClean,
  applySecurityHeaders,
  createRateLimiter,
} = require("./middlewares/security.middleware");
const { requestTimeout } = require("./middlewares/requestTimeout.middleware");

const authRoutes = require("./routes/auth.routes");
const movieRoutes = require("./routes/movie.routes");
const categoryRoutes = require("./routes/category.routes");
const tagRoutes = require("./routes/tag.routes");
const paymentRoutes = require("./routes/payment.routes");
const adminRoutes = require("./routes/admin.routes");
const userRoutes = require("./routes/user.routes");
const { notFoundHandler, errorHandler } = require("./middlewares/error.middleware");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", env.trustProxy);

let helmetMiddleware = null;
let compressionMiddleware = null;
try {
  helmetMiddleware = require("helmet");
} catch (error) {
  helmetMiddleware = null;
}
try {
  compressionMiddleware = require("compression");
} catch (error) {
  compressionMiddleware = null;
}

const isProduction = env.nodeEnv === "production";
const fallbackOrigins = [
  "https://ott-tube-admin.onrender.com",
  "http://localhost:5173",
];
const configuredOrigins = Array.isArray(env.allowedOrigins) ? env.allowedOrigins : [];
const allowedOrigins = new Set(configuredOrigins.length ? configuredOrigins : fallbackOrigins);
if (!isProduction) {
  allowedOrigins.add("http://localhost:5173");
  allowedOrigins.add("http://localhost:3000");
  allowedOrigins.add("http://127.0.0.1:5173");
}

if (isProduction && configuredOrigins.length === 0) {
  console.error(
    "[CORS] ALLOWED_ORIGINS is empty in production. Applying secure fallback allowlist."
  );
}

const corsOptions = {
  origin: (origin, callback) => {
    // No Origin header => native mobile app, Postman, curl.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS policy: Access denied for origin ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
if (helmetMiddleware) {
  app.use(helmetMiddleware());
}
if (compressionMiddleware) {
  app.use(compressionMiddleware());
}
app.use(requestLogger);
app.use(applySecurityHeaders);
app.use(createRateLimiter({ windowMs: env.rateLimitWindowMs, max: env.rateLimitMax }));
app.use(requestTimeout(env.requestTimeoutMs));
// capture raw request body in case we need to verify signatures (webhooks)
app.use(express.json({
  limit: env.jsonLimit,
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  },
}));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize);
app.use(xssClean);

app.get("/health", (req, res) => {
  return res.status(200).json({ success: true, message: "OK" });
});

app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
