const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { authenticate, authorizeRole } = require('../middlewares/authMiddleware');

// Ottenere tutte le location (riservato agli organizer)
router.get('/', authenticate, authorizeRole('organizer'), locationController.getAllLocations);

// Ottenere le location gestite dall'organizer autenticato
router.get('/organizer', authenticate, authorizeRole('organizer'), locationController.getOrganizerLocations);

// Creare una nuova location
router.post('/', authenticate, authorizeRole('organizer'), locationController.createLocation);

// Modificare una location
router.put('/:id', authenticate, authorizeRole('organizer'), locationController.updateLocation);

// Modificare orari e posti massimi di una location
router.patch('/:id/times-seats', authenticate, authorizeRole('organizer'), locationController.updateLocationTimesAndSeats);

// Eliminare una location
router.delete('/:id', authenticate, authorizeRole('organizer'), locationController.deleteLocation);

module.exports = router;
