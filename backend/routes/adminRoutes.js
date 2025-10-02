const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

// ================== Multer Config for Product Images ==================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, ''));
  }
});
const upload = multer({ storage });

// ================== Admin Login ==================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Set session
    req.session.isAdmin = true;
    req.session.adminName = admin.name;

    res.json({ message: 'Login successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error, try again later.' });
  }
});

// ================== Admin Middleware ==================
const authAdminSession = (req, res, next) => {
  if (!req.session.isAdmin) {
    return res.status(403).json({ message: 'Access denied. Please login as admin.' });
  }
  next();
};

// ================== Admin Routes ==================

// Add a new product (with optional image upload)
router.post('/products', authAdminSession, upload.single('image'), async (req, res) => {
  try {
    const { title, description, price, category, stock } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const product = new Product({
      title,
      description,
      price,
      category,
      stock,
      images: imageUrl ? [imageUrl] : []
    });

    await product.save();
    res.json({ message: '✅ Product added successfully', product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all orders (with populated user info and product info)
router.get('/orders', authAdminSession, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')              // populate user name & email
      .populate('items.product', 'title price');   // populate product title & price

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
});

// Get all users
router.get('/users', authAdminSession, async (req, res) => {
  try {
    const users = await User.find().select('-password'); // exclude passwords
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// Admin logout
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: 'Logout failed' });
    res.json({ message: 'Logged out successfully' });
  });
});

module.exports = router;
