// models/UserSubscription.js
const mongoose = require("mongoose");

const userSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled", "trial"],
      default: "active",
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "annual", "lifetime"],
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    // For trial tracking
    isTrialUsed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for faster queries
userSubscriptionSchema.index({ userId: 1, status: 1 });

// Method to check if subscription is expired
userSubscriptionSchema.methods.isExpired = function () {
  return new Date() > this.endDate;
};

// Method to check if subscription is about to expire (within 7 days)
userSubscriptionSchema.methods.isExpiringSoon = function () {
  const daysUntilExpiry = Math.ceil(
    (this.endDate - new Date()) / (1000 * 60 * 60 * 24)
  );
  return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
};

module.exports = mongoose.model("UserSubscription", userSubscriptionSchema);
