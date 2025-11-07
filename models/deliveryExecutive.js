const mongoose = require("mongoose");

const deliveryExecutiveSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    role: { type: String, default: "deliveryExecutive" },
    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DeliveryExecutive", deliveryExecutiveSchema);
