const express = require('express');
const { approveProvider ,getPendingProviders,rejectProvider, assignDriverToBooking} = require('../controllers/adminController');
const { protect, adminOnly} = require('../middlewares/authMiddleware');

const router = express.Router();

router.put('/approve/:providerId', protect, adminOnly, approveProvider);
router.get('/pending-providers', protect, adminOnly, getPendingProviders);
router.get('/rejected-provider',protect, adminOnly, rejectProvider );
router.put('/assign-driver/:bookingId', protect, adminOnly, assignDriverToBooking);
module.exports = router;
