const mongoose = require('mongoose');
const Committee = require('../models/Committee');
const Payment = require('../models/Payment');
const { generateTurnOrder, appendMemberToTurnOrder } = require('../utils/turnOrder');
const { sendMemberAddedEmail } = require('../utils/email');

// ── Helper: seed Payment documents for all members for a given month ──────────
const seedPaymentsForMonth = async (committee, monthNumber) => {
  const ops = committee.members.map((m) => ({
    updateOne: {
      filter: { committee: committee._id, member: m._id, monthNumber },
      update: {
        $setOnInsert: {
          committee:   committee._id,
          member:      m._id,
          monthNumber,
          amount:      committee.monthlyContribution,
          status:      'Upcoming',
        },
      },
      upsert: true,
    },
  }));
  if (ops.length) await Payment.bulkWrite(ops);
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/committees
// @desc    Create a new committee (admin = current user)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const createCommittee = async (req, res, next) => {
  try {
    const { name, description, monthlyContribution, durationMonths, city, strategy } = req.body;

    const totalAmount = monthlyContribution * durationMonths;

    // Admin is automatically the first member
    const committee = await Committee.create({
      name,
      description,
      monthlyContribution,
      durationMonths,
      totalAmount,
      city,
      admin:   req.user._id,
      members: [{
        name: req.user.name,
        phone: req.user.phone,
        email: req.user.email,
        status: 'active',
        paymentStatus: 'upcoming',
        isAdmin: true,
        joinedAt: new Date(),
      }],
    });

    // Generate turn order with just the admin for now
    committee.turnOrder = generateTurnOrder(
      [committee.members[0]._id], // Use embedded member ID
      strategy || 'sequential'
    );
    await committee.save();

    // Seed payment records for month 1
    await seedPaymentsForMonth(committee, 1);

    const populated = await Committee.findById(committee._id)
      .populate('admin', 'name email phone');

    res.status(201).json({ success: true, committee: populated });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/committees
// @desc    Get all committees where the current user is admin or a named member
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getMyCommittees = async (req, res, next) => {
  try {
    // Members added by admin have no .user field — match by admin OR by user field
    const committees = await Committee.find({
      $or: [
        { admin: req.user._id },
        { 'members.user': req.user._id },
      ],
    })
      .populate('admin', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: committees.length, committees });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/committees/:id
// @desc    Get a single committee by ID
// @access  Private (members only)
// ─────────────────────────────────────────────────────────────────────────────
const getCommitteeById = async (req, res, next) => {
  try {
    const committee = await Committee.findById(req.params.id)
      .populate('admin', 'name email phone');

    if (!committee) {
      return res.status(404).json({ success: false, message: 'Committee not found.' });
    }

    // Allow access if: user is the admin, OR user is a linked member (.user field)
    const isAdmin  = committee.admin._id.toString() === req.user._id.toString();
    const isMember = committee.members.some(
      (m) => m.user && m.user._id && m.user._id.toString() === req.user._id.toString()
    );
    if (!isAdmin && !isMember) {
      return res.status(403).json({ success: false, message: 'You are not a member of this committee.' });
    }

    res.status(200).json({ success: true, committee });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/committees/:id
// @desc    Update committee details (admin only)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const updateCommittee = async (req, res, next) => {
  try {
    const committee = await Committee.findById(req.params.id);
    if (!committee) {
      return res.status(404).json({ success: false, message: 'Committee not found.' });
    }
    if (committee.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the admin can update this committee.' });
    }

    const allowed = ['name', 'description', 'city', 'status'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) committee[field] = req.body[field];
    });

    await committee.save();
    res.status(200).json({ success: true, committee });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   DELETE /api/committees/:id
// @desc    Delete a committee (admin only)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const deleteCommittee = async (req, res, next) => {
  try {
    const committee = await Committee.findById(req.params.id);
    if (!committee) {
      return res.status(404).json({ success: false, message: 'Committee not found.' });
    }
    if (committee.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the admin can delete this committee.' });
    }

    // Cascade delete all related payments
    await Payment.deleteMany({ committee: committee._id });
    await committee.deleteOne();

    res.status(200).json({ success: true, message: 'Committee and all related payments deleted.' });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/committees/join/:inviteToken
// @desc    Join a committee via invite link
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const joinCommittee = async (req, res, next) => {
  try {
    const committee = await Committee.findOne({ inviteToken: req.params.inviteToken });
    if (!committee) {
      return res.status(404).json({ success: false, message: 'Invalid or expired invite link.' });
    }
    if (committee.status !== 'active') {
      return res.status(400).json({ success: false, message: 'This committee is no longer accepting members.' });
    }

    // Check if already a member
    const alreadyMember = committee.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (alreadyMember) {
      return res.status(409).json({ success: false, message: 'You are already a member of this committee.' });
    }

    // Check capacity (members cannot exceed durationMonths)
    if (committee.members.length >= committee.durationMonths) {
      return res.status(400).json({ success: false, message: 'Committee is full. No more members can join.' });
    }

    // Add member
    committee.members.push({ user: req.user._id });

    // Append to turn order
    committee.turnOrder = appendMemberToTurnOrder(
      committee.turnOrder,
      req.user._id,
      committee.durationMonths
    );

    await committee.save();

    // Seed payment records for the new member for all remaining months
    const remainingMonths = Array.from(
      { length: committee.durationMonths - committee.currentMonth + 1 },
      (_, i) => committee.currentMonth + i
    );
    for (const month of remainingMonths) {
      await Payment.findOneAndUpdate(
        { committee: committee._id, member: req.user._id, monthNumber: month },
        {
          $setOnInsert: {
            committee:   committee._id,
            member:      req.user._id,
            monthNumber: month,
            amount:      committee.monthlyContribution,
            status:      month === committee.currentMonth ? 'Due' : 'Upcoming',
          },
        },
        { upsert: true, new: true }
      );
    }

    const populated = await Committee.findById(committee._id)
      .populate('admin', 'name email phone');

    res.status(200).json({ success: true, message: 'Successfully joined the committee.', committee: populated });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/committees/:id/invite-link
// @desc    Get the invite link for a committee (admin only)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getInviteLink = async (req, res, next) => {
  try {
    const committee = await Committee.findById(req.params.id);
    if (!committee) {
      return res.status(404).json({ success: false, message: 'Committee not found.' });
    }
    if (committee.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the admin can view the invite link.' });
    }

    const inviteUrl = `${process.env.CLIENT_URL}/join/${committee.inviteToken}`;
    res.status(200).json({ success: true, inviteUrl, inviteToken: committee.inviteToken });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/committees/:id/regenerate-invite
// @desc    Regenerate invite token (invalidates old link)
// @access  Private (admin only)
// ─────────────────────────────────────────────────────────────────────────────
const regenerateInvite = async (req, res, next) => {
  try {
    const committee = await Committee.findById(req.params.id);
    if (!committee) {
      return res.status(404).json({ success: false, message: 'Committee not found.' });
    }
    if (committee.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the admin can regenerate the invite link.' });
    }

    const crypto = require('crypto');
    committee.inviteToken = crypto.randomBytes(20).toString('hex');
    await committee.save();

    const inviteUrl = `${process.env.CLIENT_URL}/join/${committee.inviteToken}`;
    res.status(200).json({ success: true, inviteUrl, inviteToken: committee.inviteToken });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/committees/:id/members
// @desc    Add a member to committee (admin only)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const addMember = async (req, res, next) => {
  try {
    const committee = await Committee.findById(req.params.id);
    if (!committee) {
      return res.status(404).json({ success: false, message: 'Committee not found.' });
    }
    if (committee.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only admin can add members.' });
    }

    const { name, phone, email } = req.body;

    // Check if member already exists by phone or email
    const alreadyMember = committee.members.some(
      (m) => m.phone === phone || (email && m.email === email)
    );
    if (alreadyMember) {
      return res.status(409).json({ success: false, message: 'This person is already a member of the committee.' });
    }

    // Add member to committee
    const newMember = {
      name,
      phone,
      email: email || '',
      status: 'active',
      paymentStatus: 'upcoming',
      joinedAt: new Date(),
    };

    committee.members.push(newMember);
    
    // Get the new member's ID (the embedded document ID)
    const newMemberId = committee.members[committee.members.length - 1]._id;
    
    // Append to turn order
    committee.turnOrder = appendMemberToTurnOrder(
      committee.turnOrder,
      newMemberId,
      committee.durationMonths
    );

    await committee.save();

    // Fire-and-forget confirmation email — never blocks the response
    if (email) {
      sendMemberAddedEmail({
        memberEmail:    email,
        memberName:     name,
        committeeName:  committee.name,
        monthlyAmount:  committee.monthlyContribution,
        durationMonths: committee.durationMonths,
        ownerName:      req.user.name,
      });
    }

    res.status(201).json({ 
      success: true, 
      message: 'Member added successfully.', 
      committee: committee 
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   DELETE /api/committees/:id/members/:memberId
// @desc    Remove a member from committee (admin only)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const removeMember = async (req, res, next) => {
  try {
    const committee = await Committee.findById(req.params.id);
    if (!committee) {
      return res.status(404).json({ success: false, message: 'Committee not found.' });
    }
    if (committee.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only admin can remove members.' });
    }

    const memberId = req.params.memberId;
    
    // Find the member to get their info
    const member = committee.members.id(memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    // Remove member from committee
    committee.members.pull(memberId);
    
    // Remove from turn order
    committee.turnOrder = committee.turnOrder.filter(to => to.member.toString() !== memberId);

    await committee.save();

    res.status(200).json({ success: true, message: 'Member removed successfully.', committee });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PATCH /api/committees/:id/payments/:memberId
// @desc    Update payment status for a member (admin only)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const updatePaymentStatus = async (req, res, next) => {
  try {
    const committee = await Committee.findById(req.params.id);
    if (!committee) {
      return res.status(404).json({ success: false, message: 'Committee not found.' });
    }
    if (committee.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only admin can update payment status.' });
    }

    const { status, paymentDate } = req.body;
    const memberId = req.params.memberId;

    // Find the member in the committee
    const member = committee.members.id(memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    // Update member's payment status
    member.paymentStatus = status;
    if (paymentDate) {
      member.paymentDate = new Date(paymentDate);
    }

    await committee.save();

    res.status(200).json({ 
      success: true, 
      message: 'Payment status updated successfully.', 
      committee: committee 
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
};
