const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true // removes extra spaces
  },
  description: { 
    type: String,
    trim: true
  },
  price: { 
    type: Number, 
    required: true,
    min: 0 // price can't be negative
  },
  images: { 
    type: [String], 
    default: [] // array of image URLs or paths
  },
  category: { 
    type: String, 
    default: "General" // optional product category
  },
  stock: { 
    type: Number, 
    default: 100, // default stock quantity
    min: 0
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Optional: create a virtual field for main image
productSchema.virtual('mainImage').get(function() {
  return this.images.length ? this.images[0] : '';
});

module.exports = mongoose.model('Product', productSchema);
