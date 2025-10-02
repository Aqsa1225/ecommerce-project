const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');
const session = require('express-session');

dotenv.config();

const app = express();

// ---------------- CORS Setup ----------------
// Allow frontend origin and credentials (cookies)
app.use(cors({
  origin: 'http://127.0.0.1:5500', // frontend URL
  credentials: true                 // allow cookies
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------- Session Setup ----------------
app.use(session({
  secret: process.env.SESSION_SECRET || 'mysecretkey',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,   // set to true only if using HTTPS
    sameSite: 'lax'  // ensures cookies work across localhost
  }
}));

// ---------------- Connect to MongoDB ----------------
connectDB().then(() => {
  console.log('✅ MongoDB connected');
});

// ---------------- Import API routes ----------------
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');

// ---------------- API Routes ----------------
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// ------------------ Admin login & dashboard ------------------

// Show login page
app.get('/adminLogin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/adminLogin.html'));
});

// Handle dashboard access
app.get('/adminDashboard', (req, res) => {
  if (!req.session.isAdmin) {
    return res.redirect('/adminLogin');
  }
  res.sendFile(path.join(__dirname, '../frontend/admin-Dashboard.html'));
});

// Handle logout
app.get('/adminLogout', (req, res) => {
  req.session.destroy();
  res.redirect('/adminLogin');
});

// Fallback
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ---------------- Start server ----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
