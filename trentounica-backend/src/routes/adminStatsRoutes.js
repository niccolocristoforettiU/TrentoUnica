const express = require('express');
const router = express.Router();
const { authenticate, authorizeRole } = require('../middlewares/authMiddleware');
const adminStatsController = require('../controllers/adminStatsController');

// Rotta per ottenere i flussi stimati su mappa
router.get('/flows', authenticate, authorizeRole('admin'), adminStatsController.getEstimatedFlows);

// Rotta per ottenere l'istogramma delle presenze per età
router.get('/histogram', authenticate, authorizeRole('admin'), adminStatsController.getEventHistogram);

module.exports = router;
