// createAdmin.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config(); // Loads MONGO_URI from .env

// 1️⃣ Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// 2️⃣ Admin schema
const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { timestamps: true });

const Admin = mongoose.model("Admin", adminSchema);

// 3️⃣ Create admin function
async function createAdmin() {
  try {
    // Check if admin already exists
    const existing = await Admin.findOne({ email: "admin@example.com" });
    if (existing) {
      console.log("ℹ️ Admin already exists!");
      process.exit();
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    const admin = new Admin({
      name: "Super Admin",
      email: "admin@example.com",
      password: hashedPassword
    });

    await admin.save();
    console.log("✅ Admin created successfully!");
    console.log("You can now login with:");
    console.log("Email: admin@example.com");
    console.log("Password: Admin@123");
    process.exit();
  } catch (err) {
    console.error("❌ Error creating admin:", err);
    process.exit(1);
  }
}

createAdmin();
