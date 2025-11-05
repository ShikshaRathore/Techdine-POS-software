const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  menu: { type: mongoose.Schema.Types.ObjectId, ref: "Menu", required: true },
});

categorySchema.index({ name: 1, menu: 1 }, { unique: true });

module.exports = mongoose.model("Category", categorySchema);
