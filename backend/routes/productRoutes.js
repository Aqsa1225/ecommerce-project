const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Product = require("../models/Product");

// ✅ Get all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();

    // Add full URL for each image so frontend can display
    const host = req.get("host"); // e.g., localhost:5000
    const protocol = req.protocol; // http
    const productsWithFullImages = products.map(p => {
      const images = p.images.map(img => `${protocol}://${host}${img}`);
      return { ...p.toObject(), images };
    });

    res.json(productsWithFullImages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get single product by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  try {
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const host = req.get("host");
    const protocol = req.protocol;
    const images = product.images.map(img => `${protocol}://${host}${img}`);

    res.json({ ...product.toObject(), images });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Add a new product
router.post("/", async (req, res) => {
  const { title, description, price, images, category, stock } = req.body;

  if (!title || !price) {
    return res.status(400).json({ message: "Please provide title and price" });
  }

  try {
    const product = new Product({
      title,
      description,
      price,
      images: images || [],
      category: category || "General",
      stock: stock || 100
    });

    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Bulk insert multiple products
router.post("/bulk", async (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ message: "Expected an array of products" });
    }

    const productsToInsert = req.body.map(p => ({
      title: p.title,
      description: p.description || "",
      price: p.price,
      images: p.images || [],
      category: p.category || "General",
      stock: p.stock || 100
    }));

    await Product.insertMany(productsToInsert);
    res.status(201).json({ message: "Products added successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Delete a product by ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  try {
    const product = await Product.findByIdAndDelete(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
