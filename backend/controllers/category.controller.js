const Category = require("../models/category.model");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { cache } = require("../services/cache.service");

const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    throw new ApiError(400, "Category name is required");
  }

  const existing = await Category.findOne({ name: name.trim() });
  if (existing) {
    throw new ApiError(409, "Category already exists");
  }

  const category = await Category.create({ name: name.trim() });
  cache.clearPrefix("categories:list");
  return res.status(201).json({ success: true, message: "Category created", data: category });
});

const listCategories = asyncHandler(async (req, res) => {
  const cached = cache.get("categories:list");
  if (cached) {
    return res.status(200).json(cached);
  }

  const categories = await Category.find().select("-__v").sort({ name: 1 }).lean();
  const responsePayload = { success: true, message: "Categories fetched", data: categories };
  cache.set("categories:list", responsePayload, 60 * 1000);
  return res.status(200).json(responsePayload);
});

module.exports = { createCategory, listCategories };
