const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    monthlyPrice: { type: Number, default: null },
    annualPrice: { type: Number, default: null },
    lifetimePrice: { type: Number, default: null },

    // badges
    isRecommended: { type: Boolean, default: false },
    isTrial: { type: Boolean, default: false },
    trialDays: { type: Number, default: 0 },
    isPrivate: { type: Boolean, default: false },

    // enable/disable modules
    modules: [
      {
        type: String, // example: "menu", "staff", "order", "reports"
      },
    ],

    additionalFeatures: [{ type: String }],
    description: { type: String },

    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Package", packageSchema);
