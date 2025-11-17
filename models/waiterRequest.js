const mongoose = require("mongoose");

const waiterRequestSchema = new mongoose.Schema(
  {
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: true,
    },
    area: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Area",
      required: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Attended"],
      default: "Pending",
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },
  },
  { timestamps: true }
);

// Mark as completed
waiterRequestSchema.methods.complete = async function () {
  this.status = "Attended";
  return this.save();
};

// Get pending requests for a branch
waiterRequestSchema.statics.getPendingRequests = function (branchId) {
  return this.find({ branch: branchId, status: "Pending" })
    .populate("table", "tableCode")
    .populate("area", "name")
    .populate("assignedTo", "name")
    .sort({ createdAt: 1 });
};

module.exports = mongoose.model("WaiterRequest", waiterRequestSchema);
