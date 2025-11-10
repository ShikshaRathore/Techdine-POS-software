// const mongoose = require("mongoose");

// const tableSchema = new mongoose.Schema({
//   area: { type: mongoose.Schema.Types.ObjectId, ref: "Area", required: true },
//   tableCode: { type: String, required: true, trim: true },
//   seatingCapacity: { type: Number, required: true },
//   availabilityStatus: {
//     type: String,
//     enum: ["Available", "Occupied", "Reserved"],
//     default: "Available",
//   },
//   status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
// });

// module.exports = mongoose.model("Table", tableSchema);

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

  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active",
  },

  // Reference to active session
  activeSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TableSession",
  },
});

// Method to check if table is in use
tableSchema.methods.isInUse = function () {
  return this.availabilityStatus === "Occupied" && this.activeSession != null;
};

// Method to occupy table
tableSchema.methods.occupy = async function (sessionId) {
  this.availabilityStatus = "Occupied";
  this.activeSession = sessionId;
  return this.save();
};

// Method to free table
tableSchema.methods.free = async function () {
  this.availabilityStatus = "Available";
  this.activeSession = null;
  return this.save();
};

module.exports = mongoose.model("Table", tableSchema);
