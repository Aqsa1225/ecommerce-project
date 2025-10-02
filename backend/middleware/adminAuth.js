const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Get token from headers
  const token = req.headers.authorization?.split(' ')[1] || req.query.token;
  if (!token) return res.status(401).send('Access denied. No token provided.');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).send('Access denied. Not admin.');
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(400).send('Invalid token.');
  }
};
