const express = require('express');
const router = express.Router();

const {
  getTratteByStatusAndDate,
  updateTrattaStatusByTransport,
  updateTrattaStatusByAdmin,
  generateTratteForEvent,
  updateTrattaByTransport,
  getTratteByEvent,
  getTrattaActiveStatus,
  getAddressByCoords,
  deleteTratta
} = require('../controllers/tratteController');

const { authenticate, authorizeRole } = require('../middlewares/authMiddleware');

// GET con filtri per stato e data
router.get('/status/:status/filter', authenticate, getTratteByStatusAndDate);

// PUT - Cambio stato per trasporti
router.put('/:id/status/transport', authenticate, authorizeRole('trasporti'), updateTrattaStatusByTransport);

// PUT - Cambio informazione per tratta
router.put('/:id/transport', updateTrattaByTransport);

// PUT - Cambio stato per admin
router.put('/:id/status/admin', authenticate, authorizeRole('admin'), updateTrattaStatusByAdmin);

router.post('/generate/:eventId', generateTratteForEvent);

//GET - Ottieni tutte le tratte per un evento
router.get('/event/:eventId', authenticate, getTratteByEvent);

//GET - Controlla se una tratta è attiva
router.get('/:id/active', authenticate, getTrattaActiveStatus);

//GET - Controlla se una tratta è attiva
router.get('/:id/active', authenticate, getTrattaActiveStatus);

//GET - Indirizzo da coordinate
router.get('/reverse-geocode', authenticate, getAddressByCoords);

router.delete('/:id', authenticate, authorizeRole('admin', 'organizer'), deleteTratta);

module.exports = router;
