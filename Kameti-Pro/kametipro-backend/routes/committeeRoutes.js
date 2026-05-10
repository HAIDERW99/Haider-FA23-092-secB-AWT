const express  = require('express');
const { body } = require('express-validator');
const {
  createCommittee,
  getMyCommittees,
  getCommitteeById,
  updateCommittee,
  deleteCommittee,
  joinCommittee,
  getInviteLink,
  regenerateInvite,
  addMember,
  removeMember,
  updatePaymentStatus,
} = require('../controllers/committeeController');
const { protect } = require('../middleware/auth');
const validate    = require('../middleware/validate');

const router = express.Router();

// All committee routes require authentication
router.use(protect);

// ── Validation chains ─────────────────────────────────────────────────────────
const createRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Committee name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('monthlyContribution')
    .notEmpty().withMessage('Monthly contribution is required')
    .isFloat({ min: 1 }).withMessage('Monthly contribution must be a positive number'),
  body('durationMonths')
    .notEmpty().withMessage('Duration is required')
    .isInt({ min: 2, max: 60 }).withMessage('Duration must be between 2 and 60 months'),
  body('strategy')
    .optional()
    .isIn(['sequential', 'random']).withMessage('Strategy must be sequential or random'),
];

const updateRules = [
  body('name').optional().trim().isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('status').optional().isIn(['active', 'completed', 'paused']).withMessage('Invalid status value'),
];

const addMemberRules = [
  body('name').trim().notEmpty().withMessage('Member name is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('email').optional().isEmail().withMessage('Invalid email address'),
];

const updatePaymentRules = [
  body('status')
    .customSanitizer((v) => (typeof v === 'string' ? v.toLowerCase() : v))
    .isIn(['paid', 'due', 'upcoming']).withMessage('Invalid payment status'),
  body('paymentDate').optional().isISO8601().withMessage('Invalid payment date'),
  body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be positive'),
];

// ── Routes ────────────────────────────────────────────────────────────────────

// CRUD
router.post('/',    createRules, validate, createCommittee);
router.get('/',     getMyCommittees);

// Member Management (admin only) - Put before general /:id routes
router.post('/:id/members',  addMemberRules, validate, addMember);
router.delete('/:id/members/:memberId', removeMember);

// Payment Status Update (admin only) - Put before general /:id routes
router.patch('/:id/payments/:memberId', updatePaymentRules, validate, updatePaymentStatus);

// Invite - Put after more specific routes
router.post('/join/:inviteToken',     joinCommittee);
router.get('/:id',  getCommitteeById);
router.get('/:id/invite-link',       getInviteLink);
router.post('/:id/regenerate-invite', regenerateInvite);
router.put('/:id',  updateRules, validate, updateCommittee);
router.delete('/:id', deleteCommittee);

module.exports = router;
