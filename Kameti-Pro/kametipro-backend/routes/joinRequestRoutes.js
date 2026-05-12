const express = require('express');
const {
  getPublicCommittees,
  sendJoinRequest,
  getIncomingRequests,
  respondToRequest,
  getMyRequests,
} = require('../controllers/joinRequestController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Browse public committees
router.get('/public-committees', getPublicCommittees);

// Current user's own requests
router.get('/my', getMyRequests);

// Incoming requests for committees I own
router.get('/incoming', getIncomingRequests);

// Send a join request
router.post('/:committeeId', sendJoinRequest);

// Accept / reject a request
router.patch('/:requestId/respond', respondToRequest);

module.exports = router;
