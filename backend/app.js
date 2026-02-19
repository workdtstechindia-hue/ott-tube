const express = require("express");
const cors = require("cors");
const env = require("./config/env");

const authRoutes = require("./routes/auth.routes");
const movieRoutes = require("./routes/movie.routes");
const categoryRoutes = require("./routes/category.routes");
const tagRoutes = require("./routes/tag.routes");
const paymentRoutes = require("./routes/payment.routes");
const adminRoutes = require("./routes/admin.routes");
const userRoutes = require("./routes/user.routes");
const { notFoundHandler, errorHandler } = require("./middlewares/error.middleware");

const app = express();

// Configure CORS with origin whitelist for APK and web clients
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, curl requests)
    if (!origin) {
      return callback(null, true);
    }
    // Add your APK domain/IP and frontend origins here
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:8081",
      "https://localhost:3000",
      "https://localhost:5173",
      // Add your production frontend URL here
      ...(env.frontendUrl ? [env.frontendUrl] : []),
    ];
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === "development") {
      callback(null, true);
    } else {
      callback(null, true); // For development, allow all; restrict in production
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
// capture raw request body in case we need to verify signatures (webhooks)
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  },
}));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "OK" });
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
