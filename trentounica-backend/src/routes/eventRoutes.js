// src/routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorizeRole } = require('../middlewares/authMiddleware');
const eventController = require('../controllers/eventController');

// Ottenere tutte le location disponibili per la creazione degli eventi (solo per organizer)
router.get('/locations', authenticate, authorizeRole('organizer'), eventController.getLocations);

// Elenco eventi (pubblici)
router.get('/', eventController.getAllEvents);

// Creazione evento (solo per organizer autorizzati in location)
router.post('/', authenticate, authorizeRole('organizer'), eventController.createEvent);

// Dettagli evento (pubblico)
router.get('/:id', eventController.getEventById);

// Modifica evento (solo per organizer che gestisce la location)
router.put('/:id', authenticate, authorizeRole('organizer'), eventController.updateEvent);

// Eliminazione evento (solo organizer che è proprietario)
router.delete('/:id', authenticate, authorizeRole('organizer'), eventController.deleteEvent);

module.exports = router;