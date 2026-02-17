const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { signToken } = require("../utils/jwt");
const env = require("../config/env");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getEnvAdmin = () => ({
  id: "admin",
  name: String(env.adminName || "Admin").trim(),
  email: String(env.adminEmail || "").trim().toLowerCase(),
  password: String(env.adminPassword || ""),
  role: "admin",
});

const sanitizeAccount = (account) => ({
  id: String(account.id || account._id),
  name: account.name,
  email: account.email,
  role: account.role,
});

const sendAuthSuccess = (res, account, message = "Login successful", statusCode = 200) => {
  const tokenPayload = {
    id: String(account.id || account._id),
    name: account.name,
    role: account.role,
  };

  const token = signToken(tokenPayload);

  return res.status(statusCode).json({
    success: true,
    message,
    data: {
      user: sanitizeAccount(account),
      token,
    },
  });
};

const validateRegisterPayload = ({ name, email, password }) => {
  if (!name || !email || !password) {
    throw new ApiError(400, "name, email and password are required");
  }

  const normalizedName = String(name).trim();
  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedPassword = String(password);

  if (normalizedName.length < 2) {
    throw new ApiError(400, "name must be at least 2 characters");
  }

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new ApiError(400, "invalid email format");
  }

  if (normalizedPassword.length < 6) {
    throw new ApiError(400, "password must be at least 6 characters");
  }

  return {
    normalizedName,
    normalizedEmail,
    normalizedPassword,
  };
};

const validateLoginPayload = ({ email, password }) => {
  if (!email || !password) {
    throw new ApiError(400, "email and password are required");
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new ApiError(400, "invalid email format");
  }

  return {
    normalizedEmail,
    normalizedPassword: String(password),
  };
};

const register = asyncHandler(async (req, res) => {
  const { normalizedName, normalizedEmail, normalizedPassword } = validateRegisterPayload(req.body);
  const envAdmin = getEnvAdmin();

  if (envAdmin.email && normalizedEmail === envAdmin.email) {
    throw new ApiError(409, "Email already registered");
  }

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new ApiError(409, "Email already registered");
  }

  let user;
  try {
    user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: normalizedPassword,
      role: "user",
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, "Email already registered");
    }
    throw error;
  }

  return sendAuthSuccess(res, user, "Login successful", 200);
});

const loginBase = async (email, password) => {
  const user = await User.findOne({ email })
    .select("+password _id name email role isActive")
    .exec();
  if (!user || !user.isActive) {
    throw new ApiError(401, "Invalid credentials");
  }

  const matched = await user.comparePassword(password);
  if (!matched) {
    throw new ApiError(401, "Invalid credentials");
  }

  return user;
};

const login = asyncHandler(async (req, res) => {
  const { normalizedEmail, normalizedPassword } = validateLoginPayload(req.body);
  const envAdmin = getEnvAdmin();

  if (envAdmin.email && normalizedEmail === envAdmin.email) {
    if (normalizedPassword !== envAdmin.password) {
      throw new ApiError(401, "Invalid credentials");
    }

    return sendAuthSuccess(res, envAdmin, "Login successful", 200);
  }

  const user = await loginBase(normalizedEmail, normalizedPassword);

  return sendAuthSuccess(res, user, "Login successful", 200);
});

const adminLogin = asyncHandler(async (req, res) => {
  const { normalizedEmail, normalizedPassword } = validateLoginPayload(req.body);
  const envAdmin = getEnvAdmin();

  const isAdminEmail = envAdmin.email && normalizedEmail === envAdmin.email;
  const isValidAdminPassword = normalizedPassword === envAdmin.password;

  if (!isAdminEmail || !isValidAdminPassword) {
    throw new ApiError(401, "Invalid credentials");
  }

  return sendAuthSuccess(res, envAdmin, "Admin login successful", 200);
});

const getMe = asyncHandler(async (req, res) => {
  if (req.user.role === "admin") {
    const envAdmin = getEnvAdmin();

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: {
        id: envAdmin.id,
        name: envAdmin.name,
        email: envAdmin.email,
        role: envAdmin.role,
      },
    });
  }

  const user = await User.findById(req.user.id).select("_id name email role").lean().exec();

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json({
    success: true,
    message: "Profile fetched successfully",
    data: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

module.exports = { register, login, adminLogin, getMe };
