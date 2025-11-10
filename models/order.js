const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },

    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer", // Optional: logged-in customer
    },

    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
    },

    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MenuItem",
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
        notes: { type: String, trim: true }, // Optional customizations
      },
    ],

    orderType: {
      type: String,
      enum: ["Dine In", "Delivery", "Pickup"],
      required: true,
    },

    // ✅ Staff references
    waiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Only for Dine In
    },

    deliveryExecutive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Only for Delivery
    },

    deliveryAddress: {
      type: String, // Only for Delivery
    },

    // ✅ Detailed order status tracking
    status: {
      type: String,
      enum: [
        "Pending",
        "KOT",
        "Billed",
        "Paid",
        "Cancelled",
        "Out For Delivery",
        "Payment Due",
        "Delivered",
      ],
      default: "KOT",
    },

    // ✅ Payment tracking
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Paid", "Partial", "Refunded"],
      default: "Unpaid",
    },

    paymentMethod: {
      type: String,
      enum: ["Cash", "Card", "UPI", "Online"],
    },

    paymentDue: {
      type: Boolean,
      default: false, // True if billed but not yet paid
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    specialInstructions: {
      type: String,
      trim: true,
    },

    kotGenerated: {
      type: Boolean,
      default: false,
    },

    // ✅ Optional time fields
    billedAt: {
      type: Date, // When bill was generated
    },

    deliveredAt: {
      type: Date, // When delivered
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
