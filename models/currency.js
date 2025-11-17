const mongoose = require("mongoose");

const currencySchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Indian Rupee
    symbol: { type: String, required: true }, // ₹
    code: { type: String, required: true }, // INR
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Currency", currencySchema);
