const mongoose = require("mongoose");

const tableSessionSchema = new mongoose.Schema(
  {
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: true,
    },

    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    // Session identifier (can be used for QR code validation)
    sessionToken: {
      type: String,
      required: true,
      unique: true,
    },

    // Track all orders in this session
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],

    // Session status
    status: {
      type: String,
      enum: ["Active", "Completed", "Abandoned"],
      default: "Active",
    },

    // Total amount for all orders in session
    totalAmount: {
      type: Number,
      default: 0,
    },

    // Payment tracking
    paidAmount: {
      type: Number,
      default: 0,
    },

    // Customer info (optional if not logged in)
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },

    // Guest info for non-logged in users
    guestInfo: {
      deviceId: String, // Browser fingerprint or device ID
      ipAddress: String,
    },

    // Session timestamps
    startedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
    },

    // Last activity to detect abandoned sessions
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for quick lookups
tableSessionSchema.index({ table: 1, status: 1 });
tableSessionSchema.index({ sessionToken: 1 });
tableSessionSchema.index({ branch: 1, status: 1 });

// Method to check if session is active
tableSessionSchema.methods.isActive = function () {
  return this.status === "Active";
};

// Method to add order to session
tableSessionSchema.methods.addOrder = function (orderId, orderAmount) {
  this.orders.push(orderId);
  this.totalAmount += orderAmount;
  this.lastActivityAt = new Date();
  return this.save();
};

// Method to complete session
tableSessionSchema.methods.complete = function () {
  this.status = "Completed";
  this.completedAt = new Date();
  return this.save();
};

// Static method to find active session for table
tableSessionSchema.statics.findActiveSession = function (tableId) {
  return this.findOne({ table: tableId, status: "Active" });
};

module.exports = mongoose.model("TableSession", tableSessionSchema);
