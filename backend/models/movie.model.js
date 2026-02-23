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
    // original video file reference (kept for legacy / compatibility)
    videoFile: {
      type: mediaSchema,
      required: false,
    },
    // new HLS playlist info (Cloudinary folder is stored to allow later cleanup)
    hlsPlaylistUrl: {
      type: String,
      trim: true,
      default: null,
    },
    hlsFolder: {
      type: String,
      trim: true,
      default: null,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],
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

movieSchema.index({ createdAt: -1 });
movieSchema.index({ category: 1, createdAt: -1 });
movieSchema.index({ tags: 1, createdAt: -1 });

module.exports = mongoose.model("Movie", movieSchema);
