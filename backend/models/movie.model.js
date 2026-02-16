const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true, index: true },
    resourceType: { type: String, enum: ["image", "video"], required: true },
  },
  { _id: false }
);

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    actors: [{ type: String, trim: true }],
    rating: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    coverImage: {
      type: mediaSchema,
      required: true,
    },
    videoFile: {
      type: mediaSchema,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Movie", movieSchema);
