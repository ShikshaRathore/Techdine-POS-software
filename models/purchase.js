// models/Purchase.js
const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema(
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
    packageName: {
      type: String,
      required: true,
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "annual", "lifetime"],
      required: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    nextPaymentDate: {
      type: Date,
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    paymentGateway: {
      type: String,
      enum: ["razorpay", "stripe", "paypal", "offline", "free"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "completed",
    },
    paymentResponse: {
      type: mongoose.Schema.Types.Mixed, // Store payment gateway response
    },
    invoiceUrl: {
      type: String,
    },
    invoiceNumber: {
      type: String,
    },
  },
  { timestamps: true }
);

// Index for faster queries
purchaseSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Purchase", purchaseSchema);
