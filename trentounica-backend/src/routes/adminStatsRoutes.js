const express = require('express');
const router = express.Router();
const { authenticate, authorizeRole } = require('../middlewares/authMiddleware');
const adminStatsController = require('../controllers/adminStatsController');

// Rotta per ottenere i flussi stimati su mappa
router.get('/flows', authenticate, authorizeRole('admin'), adminStatsController.getEstimatedFlows);

// Avvia la generazione asincrona dei flussi
router.post('/flows/async', authenticate, authorizeRole('admin'), adminStatsController.startFlowGeneration);

// Recupera lo stato di avanzamento di un job
router.get('/flows/async/:jobId/progress', authenticate, authorizeRole('admin'), adminStatsController.getFlowProgress);

// Recupera il risultato finale dei flussi generati
router.get('/flows/async/:jobId/result', authenticate, authorizeRole('admin'), adminStatsController.getFlowResult);

// Rotta per ottenere l'istogramma delle presenze per età
router.get('/histogram', authenticate, authorizeRole('admin'), adminStatsController.getEventHistogram);

module.exports = router;
