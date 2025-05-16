// src/routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorizeRole } = require('../middlewares/authMiddleware');
const eventController = require('../controllers/eventController');

// Creazione evento (solo per organizer autorizzati in location)
router.post('/', authenticate, authorizeRole('organizer'), eventController.createEvent);

// Elenco eventi
router.get('/', authenticate, eventController.getAllEvents);

// Creazione evento
router.post('/', authenticate, eventController.createEvent);

// Dettagli evento
router.get('/:id', authenticate, eventController.getEventById);

// Modifica evento
router.put('/:id', authenticate, eventController.updateEvent);

// Eliminazione evento
router.delete('/:id', authenticate, eventController.deleteEvent);

module.exports = router;