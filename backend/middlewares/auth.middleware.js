const User = require("../models/user.model");
const Admin = require("../models/admin.model");
const ApiError = require("../utils/ApiError");
const { verifyToken } = require("../utils/jwt");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new ApiError(401, "Authorization token is missing"));
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    const accountModel = decoded.role === "admin" ? Admin : User;
    const user = await accountModel.findById(decoded.id).select("_id name email role isActive");
    if (!user || !user.isActive) {
      return next(new ApiError(401, "User not found or inactive"));
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    };

    return next();
  } catch (error) {
    return next(new ApiError(401, "Invalid or expired token"));
  }
};

module.exports = { authenticate };
