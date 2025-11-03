const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema({
  area: { type: mongoose.Schema.Types.ObjectId, ref: "Area", required: true },
  tableCode: { type: String, required: true, trim: true },
  seatingCapacity: { type: Number, required: true },
  availabilityStatus: {
    type: String,
    enum: ["Available", "Occupied", "Reserved"],
    default: "Available",
  },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
});

module.exports = mongoose.model("Table", tableSchema);
