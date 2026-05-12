const Committee = require('../models/Committee');

// ─────────────────────────────────────────────────────────────────────────────
// @route   PATCH /api/committees/:id/members/:memberId/merit
// @desc    Set or update merit score for a member (admin only)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const updateMeritScore = async (req, res, next) => {
  try {
    const { meritScore } = req.body;

    if (meritScore === undefined || meritScore === null) {
      return res.status(400).json({ success: false, message: 'meritScore field zaroor bhejein.' });
    }
    const score = parseInt(meritScore, 10);
    if (isNaN(score) || score < 0 || score > 100) {
      return res.status(400).json({ success: false, message: 'Merit score 0 se 100 ke darmiyan hona chahiye.' });
    }

    const committee = await Committee.findById(req.params.id);
    if (!committee) {
      return res.status(404).json({ success: false, message: 'Committee nahi mili.' });
    }
    if (committee.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Sirf committee admin merit score de sakta hai.' });
    }

    const member = committee.members.id(req.params.memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member nahi mila.' });
    }

    member.meritScore = score;
    await committee.save();

    res.status(200).json({
      success:    true,
      message:    'Merit score update ho gaya.',
      memberId:   member._id,
      meritScore: member.meritScore,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { updateMeritScore };
