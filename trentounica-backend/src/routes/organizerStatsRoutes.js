const express = require('express');
const router = express.Router();
const { authenticate, authorizeRole } = require('../middlewares/authMiddleware');
const statsController = require('../controllers/organizerStatsController');

router.get('/preferences', authenticate, authorizeRole('organizer'), statsController.getPreferencesHistogram);
router.get('/bookings', authenticate, authorizeRole('organizer'), statsController.getBookingsHistogram);
router.get('/revenues', authenticate, authorizeRole('organizer'), statsController.getRevenueHistogram);

module.exports = router;
