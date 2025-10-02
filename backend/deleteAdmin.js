// deleteAdmin.js
const mongoose = require("mongoose");
require("dotenv").config();
const Admin = require("./models/Admin");

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");

    // Delete the old admin
    const result = await Admin.deleteOne({ email: "admin@example.com" });
    if (result.deletedCount) {
      console.log("✅ Old admin deleted!");
    } else {
      console.log("ℹ️ No admin found with that email");
    }

    process.exit();
  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
