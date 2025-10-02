const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');

// ==========================
// Auth middleware
// ==========================
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// ==========================
// GET Cart items
// ==========================
router.get('/', auth, async (req, res) => {
  try {
    const cart = await Cart.find({ user: req.userId }).populate({
      path: 'product',
      select: 'title price images'
    });

    const formattedCart = cart.map(item => ({
      _id: item._id,
      quantity: item.quantity,
      product: {
        _id: item.product._id,
        title: item.product.title || 'No Title',
        price: item.product.price || 0,
        image: item.product.images?.[0] || 'placeholder.jpg'
      }
    }));

    res.json({ items: formattedCart });
  } catch (err) {
    console.error('Cart fetch error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ==========================
// Add item to cart
// ==========================
router.post('/add', auth, async (req, res) => {
  let { productId, quantity } = req.body;
  if (!productId || !quantity) return res.status(400).json({ message: 'Product and quantity required' });

  quantity = Number(quantity);

  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    let item = await Cart.findOne({ user: req.userId, product: productId });

    if (item) {
      item.quantity += quantity;
      await item.save();
      return res.json({
        message: 'Quantity updated in cart',
        item: {
          _id: item._id,
          quantity: item.quantity,
          product: {
            _id: product._id,
            title: product.title || 'No Title',
            price: product.price || 0,
            image: product.images?.[0] || 'placeholder.jpg'
          }
        }
      });
    }

    item = await Cart.create({ user: req.userId, product: productId, quantity });
    res.json({
      message: 'Item added to cart',
      item: {
        _id: item._id,
        quantity: item.quantity,
        product: {
          _id: product._id,
          title: product.title || 'No Title',
          price: product.price || 0,
          image: product.images?.[0] || 'placeholder.jpg'
        }
      }
    });
  } catch (err) {
    console.error('Add to cart error:', err.message);
    res.status(500).json({ message: 'Something went wrong adding to cart.' });
  }
});

// ==========================
// Update quantity
// ==========================
router.put('/update/:productId', auth, async (req, res) => {
  const { quantity } = req.body;
  try {
    const item = await Cart.findOne({ user: req.userId, product: req.params.productId }).populate('product', 'title price images');
    if (!item) return res.status(404).json({ message: 'Item not found' });

    item.quantity = Number(quantity);
    await item.save();

    res.json({
      message: 'Quantity updated',
      item: {
        _id: item._id,
        quantity: item.quantity,
        product: {
          _id: item.product._id,
          title: item.product.title || 'No Title',
          price: item.product.price || 0,
          image: item.product.images?.[0] || 'placeholder.jpg'
        }
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================
// Remove item from cart
// ==========================
router.delete('/remove/:productId', auth, async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.userId, product: req.params.productId });
    res.json({ message: 'Item removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================
// Checkout
// ==========================
router.post('/checkout', auth, async (req, res) => {
  const { paymentMethod } = req.body;
  if (!paymentMethod) return res.status(400).json({ message: 'Payment method is required' });

  try {
    const cartItems = await Cart.find({ user: req.userId }).populate({
      path: 'product',
      select: 'title price images'
    });

    if (!cartItems.length) return res.status(400).json({ message: 'Cart is empty' });

    const totalPrice = cartItems.reduce((acc, item) => acc + item.quantity * item.product.price, 0);

    const order = await Order.create({
      user: req.userId,
      items: cartItems.map(item => ({
        product: item.product._id,
        quantity: item.quantity
      })),
      totalPrice,
      paymentMethod,
      status: paymentMethod === 'COD' ? 'Pending' : 'Paid',
      createdAt: new Date()
    });

    await Notification.create({
      user: req.userId,
      message: `Your order #${order._id} has been placed successfully!`
    });

    await Cart.deleteMany({ user: req.userId });

    res.status(200).json({
      message: 'Order placed successfully!',
      orderId: order._id,
      paymentMethod,
      totalPrice,
      items: cartItems.map(item => ({
        quantity: item.quantity,
        product: {
          _id: item.product._id,
          title: item.product.title || 'No Title',
          price: item.product.price || 0,
          image: item.product.images?.[0] || 'placeholder.jpg'
        }
      }))
    });
  } catch (err) {
    console.error('Checkout error:', err.message);
    res.status(500).json({ message: 'Something went wrong placing order.' });
  }
});

module.exports = router;
