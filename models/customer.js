const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      unique: true,
      sparse: true, // allows multiple nulls
    },

    password: {
      type: String,
    },

    phone: {
      type: Number,
      required: true,
    },

    address: {
      type: String,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff", // optional — if staff created the customer
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);
