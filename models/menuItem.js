const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  description: { type: String },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  // user can manually add category name
  type: { type: String, enum: ["Veg", "Non Veg", "Egg"], required: true },
  price: { type: Number, required: true },
  menuItemImage: { url: String, filename: String }, // image URL or path
  hasVariations: { type: Boolean, default: false },
  preparationTime: { type: Number, default: 0 },
  menu: { type: mongoose.Schema.Types.ObjectId, ref: "Menu", required: true },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("MenuItem", menuItemSchema);
