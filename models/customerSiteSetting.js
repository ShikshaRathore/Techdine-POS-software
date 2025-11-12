const mongoose = require("mongoose");

const customerSiteSettingsSchema = new mongoose.Schema(
  {
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      unique: true,
    },
    requireLogin: {
      type: Boolean,
      default: false,
    },
    allowOrders: {
      type: Boolean,
      default: true,
    },
    allowDelivery: {
      type: Boolean,
      default: true,
    },
    allowPickup: {
      type: Boolean,
      default: true,
    },
    enableWaiterRequest: {
      type: Boolean,
      default: true,
    },
    defaultReservationStatus: {
      type: String,
      enum: ["Confirmed", "Pending"],
      default: "Confirmed",
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliveryRadius: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliveryCharges: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
customerSiteSettingsSchema.index({ branch: 1 });

// Static method to get or create settings for a branch
customerSiteSettingsSchema.statics.getOrCreate = async function (branchId) {
  let settings = await this.findOne({ branch: branchId });

  if (!settings) {
    settings = await this.create({ branch: branchId });
  }

  return settings;
};

// Instance method to check if orders are currently allowed
customerSiteSettingsSchema.methods.canAcceptOrders = function () {
  return this.allowOrders && (this.allowDelivery || this.allowPickup);
};

// Instance method to validate delivery distance
customerSiteSettingsSchema.methods.isWithinDeliveryRadius = function (
  distance
) {
  if (this.deliveryRadius === 0) return true; // unlimited
  return distance <= this.deliveryRadius;
};

// Instance method to validate minimum order amount
customerSiteSettingsSchema.methods.meetsMinimumOrder = function (orderAmount) {
  return orderAmount >= this.minOrderAmount;
};

module.exports = mongoose.model(
  "CustomerSiteSettings",
  customerSiteSettingsSchema
);
