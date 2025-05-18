// src/routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorizeRole } = require('../middlewares/authMiddleware');
const eventController = require('../controllers/eventController');

// Elenco eventi (pubblici)
router.get('/', eventController.getAllEvents);

// Creazione evento (solo organizer)
router.post('/', authenticate, authorizeRole('organizer'), eventController.createEvent);

// Dettagli evento (pubblico)
router.get('/:id', eventController.getEventById);

// Modifica evento (solo organizer)
router.put('/:id', authenticate, authorizeRole('organizer'), eventController.updateEvent);

// Eliminazione evento (solo organizer)
router.delete('/:id', authenticate, authorizeRole('organizer'), eventController.deleteEvent);

module.exports = router;