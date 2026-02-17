const ApiError = require("../utils/ApiError");

const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let details;

  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource identifier";
  }

  if (err.name === "ValidationError") {
    statusCode = 400;
    const validationErrors = Object.values(err.errors || {}).map((item) => item.message);
    message = validationErrors.join(", ");
    details = validationErrors;
  }

  if (err.code === 11000) {
    statusCode = 409;
    const duplicateField = Object.keys(err.keyValue || {})[0] || "resource";
    message = `${duplicateField} already exists`;
  }

  if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid or expired token";
  }

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
  });
};

module.exports = { notFoundHandler, errorHandler };
