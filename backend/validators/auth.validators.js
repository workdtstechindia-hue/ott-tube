const ApiError = require("../utils/ApiError");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateRegisterBody = (req, res, next) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return next(new ApiError(400, "name, email and password are required"));
  }

  if (!EMAIL_REGEX.test(String(email).trim().toLowerCase())) {
    return next(new ApiError(400, "invalid email format"));
  }

  if (String(password).length < 6) {
    return next(new ApiError(400, "password must be at least 6 characters"));
  }

  return next();
};

const validateLoginBody = (req, res, next) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return next(new ApiError(400, "email and password are required"));
  }

  if (!EMAIL_REGEX.test(String(email).trim().toLowerCase())) {
    return next(new ApiError(400, "invalid email format"));
  }

  return next();
};

module.exports = { validateRegisterBody, validateLoginBody };
