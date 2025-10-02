const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Read the token from Authorization header
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = authHeader?.split(' ')[1]?.trim();

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'mysecret123';
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // Attach user payload to request
    next();
  } catch (err) {
    console.error('JWT error:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
