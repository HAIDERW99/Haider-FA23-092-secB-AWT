const mongoose = require('mongoose');

const PAYMENT_STATUSES = ['Paid', 'Due', 'Upcoming'];

const paymentSchema = new mongoose.Schema(
  {
    committee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Committee',
      required: [true, 'Committee reference is required'],
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Member reference is required'],
    },
    monthNumber: {
      type: Number,
      required: [true, 'Month number is required'],
      min: [1, 'Month number must be at least 1'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be positive'],
    },
    status: {
      type: String,
      enum: {
        values: PAYMENT_STATUSES,
        message: `Status must be one of: ${PAYMENT_STATUSES.join(', ')}`,
      },
      default: 'Upcoming',
    },
    paidAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [200, 'Notes cannot exceed 200 characters'],
      default: '',
    },
  },
  { timestamps: true }
);

// ── Compound index: one payment record per member per month per committee ─────
paymentSchema.index({ committee: 1, member: 1, monthNumber: 1 }, { unique: true });

// ── Set paidAt timestamp automatically when status changes to Paid ────────────
paymentSchema.pre('save', function () {
  if (this.isModified('status') && this.status === 'Paid' && !this.paidAt) {
    this.paidAt = new Date();
  }
  if (this.isModified('status') && this.status !== 'Paid') {
    this.paidAt = null;
  }
});

module.exports = mongoose.model('Payment', paymentSchema);
