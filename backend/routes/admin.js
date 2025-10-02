const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

// ✅ Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // folder where images will be stored
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // unique filename
  }
});
const upload = multer({ storage });

// ✅ Middleware to verify admin token
function verifyAdmin(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Invalid token format" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.adminId = decoded.id;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

// ✅ Admin login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: "2h" });
    res.json({ token, message: "Login successful" });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Add product (with image upload)
router.post("/products", verifyAdmin, upload.single("image"), async (req, res) => {
  try {
    const { title, price, description } = req.body;
    if (!req.file) return res.status(400).json({ message: "Image is required" });

    const newProduct = new Product({
      title,
      price,
      description,
      images: ["/uploads/" + req.file.filename]
    });

    await newProduct.save();
    res.json({ message: "Product added successfully!", product: newProduct });
  } catch (err) {
    console.error("Add product error:", err);
    res.status(500).json({ message: "Error adding product" });
  }
});

// ✅ Get all orders
router.get("/orders", verifyAdmin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("products.product", "title price");
    res.json(orders);
  } catch (err) {
    console.error("Orders fetch error:", err);
    res.status(500).json({ message: "Error fetching orders" });
  }
});

// ✅ Get all users
router.get("/users", verifyAdmin, async (req, res) => {
  try {
    const users = await User.find().select("name email");
    res.json(users);
  } catch (err) {
    console.error("Users fetch error:", err);
    res.status(500).json({ message: "Error fetching users" });
  }
});

module.exports = router;
