const mongoose = require('mongoose');
const crypto   = require('crypto');

// ── Turn order entry ──────────────────────────────────────────────────────────
const turnOrderSchema = new mongoose.Schema(
  {
    month:  { type: Number, required: true },          // 1-based month number
    member: { type: mongoose.Schema.Types.ObjectId, required: true }, // Reference to embedded member
  },
  { _id: false }
);

// ── Member entry ──────────────────────────────────────────────────────────────
const memberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Member name is required'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^(\+92|0)[0-9]{10}$/, 'Please enter a valid Pakistani phone number'],
    },
    email: {
      type: String,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'due', 'upcoming'],
      default: 'upcoming',
    },
    paymentDate: {
      type: Date,
      default: null,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    // Merit score assigned by committee admin (0–100)
    meritScore: {
      type: Number,
      min: [0, 'Merit score cannot be negative'],
      max: [100, 'Merit score cannot exceed 100'],
      default: null,
    },
  },
  { _id: true }
);

// ── Committee ─────────────────────────────────────────────────────────────────
const committeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Committee name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
      default: '',
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [1, 'Total amount must be positive'],
    },
    monthlyContribution: {
      type: Number,
      required: [true, 'Monthly contribution is required'],
      min: [1, 'Monthly contribution must be positive'],
    },
    durationMonths: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [2, 'Duration must be at least 2 months'],
      max: [60, 'Duration cannot exceed 60 months'],
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: {
      type: [memberSchema],
      default: [],
    },
    turnOrder: {
      type: [turnOrderSchema],
      default: [],
    },
    currentMonth: {
      type: Number,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'paused'],
      default: 'active',
    },
    // Unique token used to generate invite links
    inviteToken: {
      type: String,
      unique: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    // Whether this committee is publicly listed for others to request joining
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ── Auto-generate invite token before first save ──────────────────────────────
committeeSchema.pre('save', function () {
  if (!this.inviteToken) {
    this.inviteToken = crypto.randomBytes(20).toString('hex');
  }
});

// ── Virtual: progress percentage ─────────────────────────────────────────────
committeeSchema.virtual('progressPercent').get(function () {
  return Math.round((this.currentMonth / this.durationMonths) * 100);
});

// ── Virtual: total members count ─────────────────────────────────────────────
committeeSchema.virtual('totalMembers').get(function () {
  // Guard against partial documents (e.g. when only selected fields are populated)
  return Array.isArray(this.members) ? this.members.length : 0;
});

committeeSchema.set('toJSON',   { virtuals: true });
committeeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Committee', committeeSchema);
