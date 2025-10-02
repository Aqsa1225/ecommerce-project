const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true } // make sure you hash before saving
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", adminSchema);
