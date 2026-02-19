const Category = require("../models/category.model");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

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
  res.status(201).json({ success: true, data: category });
});

const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.status(200).json({ success: true, data: categories });
});

module.exports = { createCategory, listCategories };