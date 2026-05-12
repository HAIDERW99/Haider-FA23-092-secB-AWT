const Committee   = require('../models/Committee');
const JoinRequest = require('../models/JoinRequest');
const User        = require('../models/User');

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/committees/public
// @desc    Get all publicly listed committees with open slots
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getPublicCommittees = async (req, res, next) => {
  try {
    // Fetch all public, active committees not owned by the current user
    const committees = await Committee.find({
      isPublic: true,
      status: 'active',
      admin: { $ne: req.user._id },
    })
      .populate('admin', 'name email ownerStats')
      .sort({ createdAt: -1 });

    // Attach current user's request status per committee
    const userRequests = await JoinRequest.find({ requester: req.user._id });
    const requestMap = {};
    userRequests.forEach((r) => {
      requestMap[r.committee.toString()] = r.status;
    });

    const result = committees.map((c) => {
      const openSlots = c.durationMonths - c.members.length;
      const stats     = c.admin?.ownerStats || { avgRating: 4.0, ratingCount: 0, isBeginner: true };

      return {
        _id:                 c._id,
        name:                c.name,
        description:         c.description,
        monthlyContribution: c.monthlyContribution,
        durationMonths:      c.durationMonths,
        city:                c.city,
        status:              c.status,
        currentMonth:        c.currentMonth,
        totalMembers:        c.members.length,
        openSlots:           openSlots > 0 ? openSlots : 0,
        admin: {
          _id:         c.admin._id,
          name:        c.admin.name,
          avgRating:   stats.avgRating,
          ratingCount: stats.ratingCount,
          isBeginner:  stats.isBeginner,
        },
        myRequestStatus: requestMap[c._id.toString()] || null,
      };
    });

    res.status(200).json({ success: true, count: result.length, committees: result });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/join-requests/:committeeId
// @desc    Send a join request to a committee owner
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const sendJoinRequest = async (req, res, next) => {
  try {
    const committee = await Committee.findById(req.params.committeeId);
    if (!committee) {
      return res.status(404).json({ success: false, message: 'Committee nahi mili.' });
    }
    if (!committee.isPublic) {
      return res.status(400).json({ success: false, message: 'Yeh committee public nahi hai.' });
    }
    if (committee.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Yeh committee abhi active nahi hai.' });
    }
    if (committee.admin.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Aap apni khud ki committee mein join request nahi bhej sakte.' });
    }

    // Check if already a member
    const alreadyMember = committee.members.some(
      (m) => m.user && m.user.toString() === req.user._id.toString()
    );
    if (alreadyMember) {
      return res.status(409).json({ success: false, message: 'Aap pehle se is committee ke member hain.' });
    }

    // Check open slots
    if (committee.members.length >= committee.durationMonths) {
      return res.status(400).json({ success: false, message: 'Committee mein jagah nahi hai.' });
    }

    // Upsert: if rejected before, allow re-request
    const existing = await JoinRequest.findOne({
      committee: committee._id,
      requester: req.user._id,
    });

    if (existing) {
      if (existing.status === 'pending') {
        return res.status(409).json({ success: false, message: 'Aapki request pehle se pending hai.' });
      }
      if (existing.status === 'accepted') {
        return res.status(409).json({ success: false, message: 'Aapki request pehle se accept ho chuki hai.' });
      }
      // rejected — allow re-request
      existing.status  = 'pending';
      existing.message = req.body.message || '';
      await existing.save();
      return res.status(200).json({ success: true, message: 'Request dobara bhej di gayi.', request: existing });
    }

    const request = await JoinRequest.create({
      committee: committee._id,
      requester: req.user._id,
      message:   req.body.message || '',
    });

    res.status(201).json({ success: true, message: 'Request bhej di gayi. Owner ke jawab ka intezaar karein.', request });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/join-requests/incoming
// @desc    Get all pending join requests for committees owned by current user
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getIncomingRequests = async (req, res, next) => {
  try {
    // Find all committees owned by this user
    const myCommittees = await Committee.find({ admin: req.user._id }).select('_id name');
    const committeeIds = myCommittees.map((c) => c._id);

    const requests = await JoinRequest.find({
      committee: { $in: committeeIds },
      status: 'pending',
    })
      .populate('requester', 'name email phone')
      .populate('committee', 'name monthlyContribution durationMonths')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: requests.length, requests });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PATCH /api/join-requests/:requestId/respond
// @desc    Accept or reject a join request (committee owner only)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const respondToRequest = async (req, res, next) => {
  try {
    const { action } = req.body; // 'accept' | 'reject'
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action "accept" ya "reject" hona chahiye.' });
    }

    const request = await JoinRequest.findById(req.params.requestId)
      .populate('requester', 'name email phone');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request nahi mili.' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Yeh request pehle se process ho chuki hai.' });
    }

    const committee = await Committee.findById(request.committee);
    if (!committee) {
      return res.status(404).json({ success: false, message: 'Committee nahi mili.' });
    }
    if (committee.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Sirf committee admin yeh action kar sakta hai.' });
    }

    if (action === 'reject') {
      request.status = 'rejected';
      await request.save();
      return res.status(200).json({ success: true, message: 'Request reject kar di gayi.', request });
    }

    // Accept: add user as member
    if (committee.members.length >= committee.durationMonths) {
      return res.status(400).json({ success: false, message: 'Committee mein jagah nahi hai.' });
    }

    const { appendMemberToTurnOrder } = require('../utils/turnOrder');
    const requester = request.requester;

    committee.members.push({
      name:          requester.name,
      phone:         requester.phone || '',
      email:         requester.email || '',
      status:        'active',
      paymentStatus: 'upcoming',
      joinedAt:      new Date(),
      isAdmin:       false,
    });

    const newMemberId = committee.members[committee.members.length - 1]._id;
    committee.turnOrder = appendMemberToTurnOrder(
      committee.turnOrder,
      newMemberId,
      committee.durationMonths
    );

    await committee.save();

    request.status = 'accepted';
    await request.save();

    res.status(200).json({ success: true, message: 'Request accept kar li gayi. Member add ho gaya.', request });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/join-requests/my
// @desc    Get current user's own join requests with status
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getMyRequests = async (req, res, next) => {
  try {
    const requests = await JoinRequest.find({ requester: req.user._id })
      .populate('committee', 'name monthlyContribution city')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: requests.length, requests });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PATCH /api/committees/:id/toggle-public
// @desc    Toggle isPublic flag on a committee (admin only)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const togglePublic = async (req, res, next) => {
  try {
    const committee = await Committee.findById(req.params.id);
    if (!committee) {
      return res.status(404).json({ success: false, message: 'Committee nahi mili.' });
    }
    if (committee.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Sirf admin yeh kar sakta hai.' });
    }

    committee.isPublic = !committee.isPublic;
    await committee.save();

    res.status(200).json({
      success: true,
      message: committee.isPublic ? 'Committee public kar di gayi.' : 'Committee private kar di gayi.',
      isPublic: committee.isPublic,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPublicCommittees,
  sendJoinRequest,
  getIncomingRequests,
  respondToRequest,
  getMyRequests,
  togglePublic,
};
