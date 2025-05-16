// src/routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorizeRole } = require('../middlewares/authMiddleware');
const eventController = require('../controllers/eventController');

// Ottenere tutte le location disponibili per la creazione degli eventi (solo per organizer)
router.get('/locations', authenticate, authorizeRole('organizer'), eventController.getLocations);


// Elenco eventi
router.get('/', authenticate, eventController.getAllEvents);

// Creazione evento (solo per organizer autorizzati in location)
router.post('/', authenticate, authorizeRole('organizer'), eventController.createEvent);

// Dettagli evento
router.get('/:id', authenticate, eventController.getEventById);

// Modifica evento
router.put('/:id', authenticate, authorizeRole('organizer'), eventController.updateEvent);

// Eliminazione evento
router.delete('/:id', authenticate, authorizeRole('organizer'), eventController.deleteEvent);

module.exports = router;