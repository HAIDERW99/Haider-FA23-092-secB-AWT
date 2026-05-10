const express  = require('express');
const { body } = require('express-validator');
const {
  getPaymentHistory,
  getMyPayments,
  markAsPaid,
  updatePaymentStatus,
  advanceMonth,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const validate    = require('../middleware/validate');

const router = express.Router();

// All payment routes require authentication
router.use(protect);

// ── Validation ────────────────────────────────────────────────────────────────
const statusRules = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['Paid', 'Due', 'Upcoming']).withMessage('Status must be Paid, Due, or Upcoming'),
];

// ── Routes ────────────────────────────────────────────────────────────────────

// Committee-scoped
router.get('/committee/:committeeId',               getPaymentHistory);
router.get('/my/:committeeId',                      getMyPayments);
router.post('/committee/:committeeId/advance-month', advanceMonth);

// Payment-record-scoped
router.patch('/:paymentId/mark-paid',               markAsPaid);
router.patch('/:paymentId/status', statusRules, validate, updatePaymentStatus);

module.exports = router;
