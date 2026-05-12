const mongoose = require('mongoose');

/**
 * OwnerRating — a member's star rating (1–5) for a committee owner.
 * Rules enforced at controller level:
 *   - rater must be a current member of the committee
 *   - rater cannot be the owner
 *   - one rating per rater per committee (upsert on update)
 */
const ownerRatingSchema = new mongoose.Schema(
  {
    committee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Committee',
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
  },
  { timestamps: true }
);

// One rating per rater per committee
ownerRatingSchema.index({ committee: 1, rater: 1 }, { unique: true });

module.exports = mongoose.model('OwnerRating', ownerRatingSchema);
