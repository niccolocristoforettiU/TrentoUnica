const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const controller = require('../controllers/eventPreferenceController');

// Verifica se l'utente ha espresso preferenza per un evento
router.get('/:eventId', authenticate, controller.checkPreference);

// Esprime una preferenza
router.post('/:eventId', authenticate, controller.expressPreference);

// Rimuove una preferenza
router.delete('/:eventId', authenticate, controller.removePreference);

module.exports = router;
