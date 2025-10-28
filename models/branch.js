const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const branchSchema = new Schema({
  branchName: { type: String, required: true }, // Branch name
  country: { type: String, required: true },
  address: { type: String, required: true }, // Use lowercase key for consistency
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Super admin
  branchHead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  }, // Optional branch head / manager
  areas: [{ type: mongoose.Schema.Types.ObjectId, ref: "Area" }], // Linked service areas
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model("Branch", branchSchema);
