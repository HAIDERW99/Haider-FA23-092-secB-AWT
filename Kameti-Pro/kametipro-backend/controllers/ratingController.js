const Committee   = require('../models/Committee');
const OwnerRating = require('../models/OwnerRating');
const User        = require('../models/User');

// ── Helper: recalculate and persist ownerStats on the User document ───────────
const refreshOwnerStats = async (ownerId) => {
  // Count and sum ALL ratings for this owner across ALL committees
  const all   = await OwnerRating.find({ owner: ownerId });
  const count = all.length;
  const avg   = count > 0
    ? parseFloat((all.reduce((s, r) => s + r.rating, 0) / count).toFixed(1))
    : 4.0; // default display rating when no real ratings yet

  // Beginner badge removed once 5 or more unique members have rated
  const isBeginner = count < 5;

  // Use $set explicitly — required for dot-notation subdocument updates.
  // Without $set, Mongoose treats the plain object as a full replacement document.
  await User.findByIdAndUpdate(
    ownerId,
    {
      $set: {
        'ownerStats.avgRating':   avg,
        'ownerStats.ratingCount': count,
        'ownerStats.isBeginner':  isBeginner,
      },
    },
    { new: true, upsert: false }
  );

  return { avgRating: avg, ratingCount: count, isBeginner };
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/ratings/:committeeId
// @desc    Rate the owner of a committee (members only, not the owner themselves)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const rateOwner = async (req, res, next) => {
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating 1 se 5 ke darmiyan honi chahiye.' });
    }

    const committee = await Committee.findById(req.params.committeeId);
    if (!committee) {
      return res.status(404).json({ success: false, message: 'Committee nahi mili.' });
    }

    // Owner cannot rate themselves
    if (committee.admin.toString() === req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Aap apne aap ko rate nahi kar sakte.' });
    }

    // Only current members can rate (members with a linked user account)
    const isMember = committee.members.some(
      (m) => m.user && m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Sirf committee ke members rate kar sakte hain.' });
    }

    // Upsert: one rating per rater per committee
    const existing = await OwnerRating.findOne({
      committee: committee._id,
      rater:     req.user._id,
    });

    if (existing) {
      existing.rating = rating;
      await existing.save();
    } else {
      await OwnerRating.create({
        committee: committee._id,
        owner:     committee.admin,
        rater:     req.user._id,
        rating,
      });
    }

    // Recalculate and persist owner stats
    const stats = await refreshOwnerStats(committee.admin);

    res.status(200).json({
      success:        true,
      message:        'Rating de di gayi.',
      ownerAvgRating: stats.avgRating,
      ratingCount:    stats.ratingCount,
      isBeginner:     stats.isBeginner,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/ratings/owner/:ownerId
// @desc    Get average rating for an owner
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getOwnerRating = async (req, res, next) => {
  try {
    const owner = await User.findById(req.params.ownerId).select('ownerStats');

    // If ownerStats is missing (user created before field was added), recalculate
    let stats = owner?.ownerStats;
    if (!stats || stats.ratingCount === undefined) {
      stats = await refreshOwnerStats(req.params.ownerId);
    }

    const myRating = await OwnerRating.findOne({
      owner: req.params.ownerId,
      rater: req.user._id,
    });

    res.status(200).json({
      success:     true,
      avgRating:   stats.avgRating   ?? 4.0,
      ratingCount: stats.ratingCount ?? 0,
      isBeginner:  stats.isBeginner  ?? true,
      myRating:    myRating ? myRating.rating : null,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/ratings/committee/:committeeId/my
// @desc    Get current user's rating for this committee's owner
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getMyRatingForCommittee = async (req, res, next) => {
  try {
    const committee = await Committee.findById(req.params.committeeId);
    if (!committee) {
      return res.status(404).json({ success: false, message: 'Committee nahi mili.' });
    }

    const myRating = await OwnerRating.findOne({
      committee: committee._id,
      rater:     req.user._id,
    });

    // Read from owner's cached stats.
    // Use findByIdAndUpdate with $setOnInsert-style to ensure ownerStats exists
    // for users created before this field was added to the schema.
    const owner = await User.findByIdAndUpdate(
      committee.admin,
      {
        $setOnInsert: {
          'ownerStats.avgRating':   4.0,
          'ownerStats.ratingCount': 0,
          'ownerStats.isBeginner':  true,
        },
      },
      { new: true, upsert: false, select: 'ownerStats' }
    );

    // If ownerStats is missing (old user doc), recalculate from scratch
    let stats = owner?.ownerStats;
    if (!stats || stats.ratingCount === undefined) {
      stats = await refreshOwnerStats(committee.admin);
    }

    res.status(200).json({
      success:     true,
      myRating:    myRating ? myRating.rating : null,
      avgRating:   stats.avgRating   ?? 4.0,
      ratingCount: stats.ratingCount ?? 0,
      isBeginner:  stats.isBeginner  ?? true,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { rateOwner, getOwnerRating, getMyRatingForCommittee };
