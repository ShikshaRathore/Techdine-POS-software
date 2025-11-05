const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const staffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: Number,
      required: true,
    },
    role: {
      type: String,
      enum: ["Hotel-Admin", "Branch Head", "Chef", "Waiter"],
      required: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Add passport-local-mongoose plugin
staffSchema.plugin(passportLocalMongoose, {
  usernameField: "email", // Use email as username for authentication
});

module.exports = mongoose.model("Staff", staffSchema);
