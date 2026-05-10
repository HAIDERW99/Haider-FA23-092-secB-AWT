const jwt  = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes — verifies Bearer JWT and attaches req.user.
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach fresh user (without password) to request
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or deactivated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

/**
 * Restrict to committee admin only.
 * Must be used AFTER protect and after committee is loaded onto req.committee.
 */
const adminOnly = (req, res, next) => {
  if (!req.committee) {
    return res.status(500).json({ success: false, message: 'Committee not loaded on request.' });
  }
  if (req.committee.admin.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Only the committee admin can perform this action.' });
  }
  next();
};

module.exports = { protect, adminOnly };
