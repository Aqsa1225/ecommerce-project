const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');

// Auth middleware
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

// ✅ Get all orders for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId })
      .populate('items.product');
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Cancel an order (only if status is Pending)
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.userId });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.status !== 'Pending') {
      return res.status(400).json({ message: 'Only pending orders can be cancelled' });
    }

    order.status = 'Cancelled';
    await order.save();

    res.json({ message: 'Order cancelled successfully', order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
