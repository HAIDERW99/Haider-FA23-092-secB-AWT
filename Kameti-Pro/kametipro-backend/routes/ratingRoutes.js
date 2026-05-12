const express = require('express');
const { rateOwner, getOwnerRating, getMyRatingForCommittee } = require('../controllers/ratingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Rate the owner of a committee
router.post('/:committeeId', rateOwner);

// Get avg rating for an owner
router.get('/owner/:ownerId', getOwnerRating);

// Get current user's rating for a specific committee's owner
router.get('/committee/:committeeId/my', getMyRatingForCommittee);

module.exports = router;
