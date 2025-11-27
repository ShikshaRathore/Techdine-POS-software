// models/OfflineRequest.js
const mongoose = require("mongoose");

const offlineRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true,
    },
    packageName: {
      type: String,
      required: true,
    },
    billingCycle: {
      type: String,
      enum: ["trial", "monthly", "annual", "lifetime"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["bank_transfer", "upi", "cash", "cheque"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    proofDocument: {
      type: String, // URL to uploaded proof
    },
    transactionReference: {
      type: String, // UTR number, cheque number, etc.
    },
    remarks: {
      type: String,
    },
    // Admin fields
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    adminRemarks: {
      type: String,
    },
  },
  { timestamps: true }
);

// Index for faster queries
offlineRequestSchema.index({ userId: 1, status: 1 });
offlineRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("OfflineRequest", offlineRequestSchema);
