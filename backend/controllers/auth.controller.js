const User = require("../models/user.model");
const Admin = require("../models/admin.model");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { signToken } = require("../utils/jwt");

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "name, email and password are required");
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new ApiError(409, "Email already registered");
  }

  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    password: String(password),
    role: "user",
  });

  const token = signToken({ id: user._id.toString(), role: user.role });

  res.status(201).json({
    success: true,
    message: "Registered successfully",
    data: {
      user: sanitizeUser(user),
      token,
    },
  });
});

const loginBase = async (email, password) => {
  const normalizedEmail = String(email).trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).select("+password");
  if (!user || !user.isActive) {
    throw new ApiError(401, "Invalid credentials");
  }

  const matched = await user.comparePassword(String(password));
  if (!matched) {
    throw new ApiError(401, "Invalid credentials");
  }

  return user;
};

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "email and password are required");
  }

  const user = await loginBase(email, password);
  const token = signToken({ id: user._id.toString(), role: user.role });

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      user: sanitizeUser(user),
      token,
    },
  });
});

const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "email and password are required");
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await Admin.findOne({ email: normalizedEmail }).select("+password");
  if (!user || !user.isActive) {
    throw new ApiError(401, "Invalid credentials");
  }

  const matched = await user.comparePassword(String(password));
  if (!matched) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = signToken({ id: user._id.toString(), role: user.role });

  res.status(200).json({
    success: true,
    message: "Admin login successful",
    data: {
      user: sanitizeUser(user),
      token,
    },
  });
});

module.exports = { register, login, adminLogin };
