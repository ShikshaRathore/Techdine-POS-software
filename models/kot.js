const mongoose = require("mongoose");

const kotSchema = new mongoose.Schema(
  {
    kotNumber: {
      type: String,
      required: true,
      unique: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MenuItem",
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
        notes: { type: String, trim: true },
      },
    ],

    status: {
      type: String,
      enum: ["In Kitchen", "Food is Ready", "Food is Served", "Cancelled"],
      default: "In Kitchen",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "createdByModel",
      required: true,
    },

    createdByModel: {
      type: String,
      enum: ["Admin", "Staff", "Customer"],
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff", // staff who updates the KOT
    },

    remarks: {
      type: String,
      trim: true,
    },

    startedAt: Date, // when moved to 'In Kitchen'
    readyAt: Date, // when 'Food is Ready'
    servedAt: Date, // when 'Food is Served'
  },
  { timestamps: true }
);

module.exports = mongoose.model("KOT", kotSchema);
