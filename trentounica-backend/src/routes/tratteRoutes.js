const express = require('express');
const router = express.Router();

const {
  getTratteByStatusAndDate,
  updateTrattaStatusByTransport,
  updateTrattaStatusByAdmin,
  generateTratteForEvent,
  updateTrattaByTransport
} = require('../controllers/tratteController');

const { authenticate, authorizeRole } = require('../middlewares/authMiddleware');

// GET con filtri per stato e data
router.get('/status/:status/filter', authenticate, getTratteByStatusAndDate);

// PUT - Cambio stato per trasporti
router.put('/:id/status/transport', authenticate, authorizeRole('trasporti'), updateTrattaStatusByTransport);

//PUT - Cambio informazione per tratta
router.put('/:id/transport', updateTrattaByTransport);

// PUT - Cambio stato per admin
router.put('/:id/status/admin', authenticate, authorizeRole('admin'), updateTrattaStatusByAdmin);

router.post('/tratte/generate/:eventId', generateTratteForEvent);

module.exports = router;
