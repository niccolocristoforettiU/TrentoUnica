// src/routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorizeRole, optionalAuthenticate } = require('../middlewares/authMiddleware');
const eventController = require('../controllers/eventController');

// Ottenere tutte le location disponibili per la creazione degli eventi (solo per organizer)
router.get('/locations', authenticate, authorizeRole('organizer'), (req, res, next) => eventController.getLocations(req, res, next));

// Ottenere gli eventi gestiti dall'organizer autenticato
router.get('/organizer', authenticate, authorizeRole('organizer'), (req, res, next) => eventController.getOrganizerEvents(req, res, next));

// Eventi filtrati per mappa (client/admin/organizer/trasporti)
router.get('/filter', optionalAuthenticate, eventController.getFilteredEvents);

// Elenco eventi (pubblici)
router.get('/', (req, res, next) => eventController.getAllEvents(req, res, next));

// Creazione evento (solo per organizer autorizzati in location)
router.post('/', authenticate, authorizeRole('organizer'), (req, res, next) => eventController.createEvent(req, res, next));

// Dettagli evento (pubblico)
router.get('/:id', (req, res, next) => eventController.getEventById(req, res, next));

// Modifica evento (solo per organizer che ha creato l'evento)
router.put('/:id', authenticate, authorizeRole('organizer'), (req, res, next) => eventController.updateEvent(req, res, next));

// Eliminazione evento (solo organizer che ha creato l'evento)
router.delete('/:id', authenticate, authorizeRole('admin', 'organizer'), (req, res, next) => eventController.deleteEvent(req, res, next));


// Esprimere e rimuovere preferenze sugli eventi (anche guest)
router.post('/:id/preference', optionalAuthenticate, eventController.expressPreference);
router.delete('/:id/preference', optionalAuthenticate, eventController.removePreference);


router.get('/organizer/revenue', authenticate, authorizeRole('organizer'), eventController.getOrganizerRevenue);
router.get('/organizer/event-revenues', authenticate, authorizeRole('organizer'), eventController.getEventRevenues);
router.get('/organizer/bookings-count', authenticate, authorizeRole('organizer'), eventController.getEventsWithBookingCounts);

module.exports = router;