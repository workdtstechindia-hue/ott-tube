const Tag = require("../models/tag.model");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const createTag = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    throw new ApiError(400, "Tag name is required");
  }

  const existing = await Tag.findOne({ name: name.trim() });
  if (existing) {
    throw new ApiError(409, "Tag already exists");
  }

  const tag = await Tag.create({ name: name.trim() });
  res.status(201).json({ success: true, data: tag });
});

const listTags = asyncHandler(async (req, res) => {
  const tags = await Tag.find().sort({ name: 1 });
  res.status(200).json({ success: true, data: tags });
});

module.exports = { createTag, listTags };