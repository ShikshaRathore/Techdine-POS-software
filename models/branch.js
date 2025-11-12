const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const branchSchema = new Schema({
  branchName: { type: String, required: true }, // Branch name
  country: { type: String, required: true },
  address: { type: String, required: true }, // Use lowercase key for consistency
  phone: { type: Number },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Hotel-admin
  branchHead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  }, // Optional branch head / manager
  areas: [{ type: mongoose.Schema.Types.ObjectId, ref: "Area" }], // Linked service areas
  // Add this field to your Branch schema:
  aboutUs: {
    type: String,
    default: "",
  },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model("Branch", branchSchema);

// const mongoose = require("mongoose");
// const Schema = mongoose.Schema;

// const currencySchema = new Schema({
//   name: { type: String, required: true },
//   symbol: { type: String, required: true },
//   code: { type: String, required: true },
//   isDefault: { type: Boolean, default: false },
// });

// const taxSchema = new Schema({
//   name: { type: String, required: true },
//   percentage: { type: Number, required: true, min: 0, max: 100 },
// });

// const branchSchema = new Schema({
//   branchName: { type: String, required: true },
//   country: { type: String, required: true },
//   timezone: { type: String, default: "Asia/Kolkata" },
//   address: { type: String, required: true },
//   phone: { type: Number },
//   email: { type: String },
//   owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   branchHead: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     default: null,
//   },
//   areas: [{ type: mongoose.Schema.Types.ObjectId, ref: "Area" }],

//   // Settings
//   currencies: [currencySchema],
//   defaultCurrency: { type: String, default: "USD" },
//   taxes: [taxSchema],

//   // Email notification settings
//   emailNotifications: {
//     newOrderReceived: { type: Boolean, default: true },
//     reservationConfirmation: { type: Boolean, default: true },
//     newReservationReceived: { type: Boolean, default: true },
//     orderBill: { type: Boolean, default: true },
//     staffWelcomeEmail: { type: Boolean, default: true },
//   },

//   // Payment gateway settings
//   paymentGateways: {
//     razorpay: {
//       enabled: { type: Boolean, default: false },
//       keyId: { type: String },
//       keySecret: { type: String },
//     },
//     stripe: {
//       enabled: { type: Boolean, default: false },
//       publicKey: { type: String },
//       secretKey: { type: String },
//     },
//   },

//   // Theme settings
//   theme: {
//     logo: { type: String },
//     primaryColor: { type: String, default: "#EA580C" },
//   },

//   createdAt: { type: Date, default: Date.now },
//   isActive: { type: Boolean, default: true },
// });

// module.exports = mongoose.model("Branch", branchSchema);
