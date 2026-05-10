const express  = require('express');
const { body } = require('express-validator');
const { signup, login, getMe } = require('../controllers/authController');
const { protect }  = require('../middleware/auth');
const validate     = require('../middleware/validate');

const router = express.Router();

// ── Validation chains ─────────────────────────────────────────────────────────
const signupRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 80 }).withMessage('Name cannot exceed 80 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email'),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^(\+92|0)[0-9]{10}$/).withMessage('Enter a valid Pakistani phone number (e.g. 03001234567)'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginRules = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

// ── Routes ────────────────────────────────────────────────────────────────────
router.post('/signup', signupRules, validate, signup);
router.post('/login',  loginRules,  validate, login);
router.get('/me',      protect,     getMe);

module.exports = router;
