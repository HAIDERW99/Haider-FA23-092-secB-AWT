const User          = require('../models/User');
const generateToken = require('../utils/generateToken');

// ── Helper: build safe user response object ───────────────────────────────────
const userResponse = (user, token) => ({
  success: true,
  token,
  user: {
    _id:       user._id,
    name:      user.name,
    email:     user.email,
    phone:     user.phone,
    initials:  user.initials,
    createdAt: user.createdAt,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const signup = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check for existing email
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const user  = await User.create({ name, email, phone, password });
    const token = generateToken(user._id);

    res.status(201).json(userResponse(user, token));
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/login
// @desc    Authenticate user and return JWT
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Explicitly select password (it's excluded by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated.' });
    }

    const token = generateToken(user._id);
    res.status(200).json(userResponse(user, token));
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/auth/me
// @desc    Get current logged-in user profile
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      user: {
        _id:       user._id,
        name:      user.name,
        email:     user.email,
        phone:     user.phone,
        initials:  user.initials,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, login, getMe };
