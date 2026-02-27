const mongoose = require("mongoose");

const uploadSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      default: null,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    totalSize: {
      type: Number,
      required: true,
      min: 1,
    },
    totalChunks: {
      type: Number,
      required: true,
      min: 1,
    },
    uploadedChunks: {
      type: [Number],
      default: [],
    },
    status: {
      type: String,
      enum: ["uploading", "processing", "completed", "failed"],
      default: "uploading",
      index: true,
    },
    cloudinaryPublicId: {
      type: String,
      default: null,
      trim: true,
    },
    cloudinaryUrl: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

uploadSessionSchema.index({ createdAt: 1 });

module.exports = mongoose.model("UploadSession", uploadSessionSchema);
