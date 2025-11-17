const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const taxSchema = new Schema(
  {
    name: { type: String, required: true },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true, // each tax belongs to a branch
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Tax", taxSchema);
