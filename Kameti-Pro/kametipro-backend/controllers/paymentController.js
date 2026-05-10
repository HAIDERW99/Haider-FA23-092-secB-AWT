const Payment   = require('../models/Payment');
const Committee = require('../models/Committee');

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/payments/committee/:committeeId
// @desc    Get full payment history for a committee (all members, all months)
// @access  Private (members only)
// ─────────────────────────────────────────────────────────────────────────────
const getPaymentHistory = async (req, res, next) => {
  try {
    const { committeeId } = req.params;

    // Verify committee exists and user is a member
    const committee = await Committee.findById(committeeId);
    if (!committee) {
      return res.status(404).json({ success: false, message: 'Committee not found.' });
    }
    const isMember = committee.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'You are not a member of this committee.' });
    }

    // Optional filters via query params: ?month=3  ?status=Paid  ?memberId=xxx
    const filter = { committee: committeeId };
    if (req.query.month)    filter.monthNumber = Number(req.query.month);
    if (req.query.status)   filter.status      = req.query.status;
    if (req.query.memberId) filter.member       = req.query.memberId;

    const payments = await Payment.find(filter)
      .populate('member', 'name email phone')
      .sort({ monthNumber: 1, createdAt: 1 });

    // Group by month for convenience
    const byMonth = payments.reduce((acc, p) => {
      const key = p.monthNumber;
      if (!acc[key]) acc[key] = [];
      acc[key].push(p);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      count: payments.length,
      payments,
      byMonth,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/payments/my/:committeeId
// @desc    Get the current user's own payment records for a committee
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({
      committee: req.params.committeeId,
      member:    req.user._id,
    }).sort({ monthNumber: 1 });

    res.status(200).json({ success: true, count: payments.length, payments });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PATCH /api/payments/:paymentId/mark-paid
// @desc    Mark a payment as Paid (admin or the member themselves)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const markAsPaid = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    // Load committee to check admin rights
    const committee = await Committee.findById(payment.committee);
    if (!committee) {
      return res.status(404).json({ success: false, message: 'Associated committee not found.' });
    }

    const isAdmin  = committee.admin.toString() === req.user._id.toString();
    const isSelf   = payment.member.toString()  === req.user._id.toString();

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ success: false, message: 'You are not authorised to mark this payment.' });
    }

    if (payment.status === 'Paid') {
      return res.status(400).json({ success: false, message: 'Payment is already marked as Paid.' });
    }

    payment.status = 'Paid';
    payment.notes  = req.body.notes || payment.notes;
    await payment.save(); // pre-save hook sets paidAt

    const populated = await Payment.findById(payment._id).populate('member', 'name email phone');
    res.status(200).json({ success: true, message: 'Payment marked as Paid.', payment: populated });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PATCH /api/payments/:paymentId/status
// @desc    Update payment status to any value (admin only)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const updatePaymentStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const VALID = ['Paid', 'Due', 'Upcoming'];

    if (!VALID.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${VALID.join(', ')}` });
    }

    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    const committee = await Committee.findById(payment.committee);
    if (!committee) {
      return res.status(404).json({ success: false, message: 'Associated committee not found.' });
    }

    // Only admin can change to arbitrary status
    if (committee.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the committee admin can change payment status.' });
    }

    payment.status = status;
    if (notes !== undefined) payment.notes = notes;
    await payment.save();

    const populated = await Payment.findById(payment._id).populate('member', 'name email phone');
    res.status(200).json({ success: true, payment: populated });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/payments/committee/:committeeId/advance-month
// @desc    Advance committee to next month — marks current Due → Upcoming,
//          seeds new month payments (admin only)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const advanceMonth = async (req, res, next) => {
  try {
    const committee = await Committee.findById(req.params.committeeId);
    if (!committee) {
      return res.status(404).json({ success: false, message: 'Committee not found.' });
    }
    if (committee.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the admin can advance the month.' });
    }
    if (committee.currentMonth >= committee.durationMonths) {
      // Mark committee as completed
      committee.status = 'completed';
      await committee.save();
      return res.status(200).json({ success: true, message: 'Committee is now completed.', committee });
    }

    const nextMonth = committee.currentMonth + 1;

    // Seed payment records for next month
    const ops = committee.members.map((m) => ({
      updateOne: {
        filter: { committee: committee._id, member: m.user, monthNumber: nextMonth },
        update: {
          $setOnInsert: {
            committee:   committee._id,
            member:      m.user,
            monthNumber: nextMonth,
            amount:      committee.monthlyContribution,
            status:      'Due',
          },
        },
        upsert: true,
      },
    }));
    if (ops.length) await Payment.bulkWrite(ops);

    committee.currentMonth = nextMonth;
    await committee.save();

    res.status(200).json({
      success: true,
      message: `Advanced to month ${nextMonth}.`,
      currentMonth: nextMonth,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPaymentHistory,
  getMyPayments,
  markAsPaid,
  updatePaymentStatus,
  advanceMonth,
};
