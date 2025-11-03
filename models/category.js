const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  menu: { type: mongoose.Schema.Types.ObjectId, ref: "Menu", required: true },
});

module.exports = mongoose.model("Category", categorySchema);
