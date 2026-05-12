const mongoose = require('mongoose');

/**
 * JoinRequest — tracks a user's request to join a public committee.
 * Status flow: pending → accepted | rejected
 */
const joinRequestSchema = new mongoose.Schema(
  {
    committee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Committee',
      required: true,
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    message: {
      type: String,
      trim: true,
      maxlength: [200, 'Message cannot exceed 200 characters'],
      default: '',
    },
  },
  { timestamps: true }
);

// One pending request per user per committee
joinRequestSchema.index({ committee: 1, requester: 1 }, { unique: true });

module.exports = mongoose.model('JoinRequest', joinRequestSchema);
