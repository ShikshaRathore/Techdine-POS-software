const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const superAdminSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  role: { type: String, default: "superadmin", immutable: true },
  adminActions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AppSettings",
    },
  ],
});

superAdminSchema.plugin(passportLocalMongoose, { usernameField: "email" });
module.exports = mongoose.model("SuperAdmin", superAdminSchema);
