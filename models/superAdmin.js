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
  permissions: {
    manageUsers: { type: Boolean, default: true },
    manageBranches: { type: Boolean, default: true },
    extendTrial: { type: Boolean, default: true },
  },
});

superAdminSchema.plugin(passportLocalMongoose, { usernameField: "email" });
module.exports = mongoose.model("SuperAdmin", superAdminSchema);
