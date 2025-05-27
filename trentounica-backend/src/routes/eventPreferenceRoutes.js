const express = require('express');
const router = express.Router();
const { optionalAuthenticate } = require('../middlewares/authMiddleware');
const controller = require('../controllers/eventPreferenceController');

// Verifica se l'utente ha espresso preferenza per un evento
router.get('/:eventId', optionalAuthenticate, controller.checkPreference);

// Esprime una preferenza
router.post('/:eventId', optionalAuthenticate, controller.expressPreference);

// Rimuove una preferenza
router.delete('/:eventId', optionalAuthenticate, controller.removePreference);

module.exports = router;
