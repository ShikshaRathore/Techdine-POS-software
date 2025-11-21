const mongoose = require("mongoose");

const heroSectionSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    type: {
      type: String,
      enum: ["video", "image"],
      required: true,
    },
    heading: {
      type: String,
      required: true,
      trim: true,
    },
    subHeading: {
      type: String,
      trim: true,
    },
    mediaUrl: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
heroSectionSchema.index({ branchId: 1, type: 1, isActive: 1 });

module.exports = mongoose.model("HeroSection", heroSectionSchema);
