const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { authenticate, authorizeRole } = require('../middlewares/authMiddleware');

// Organizer: tutte le location
router.get('/', authenticate, authorizeRole('organizer'), locationController.getAllLocations);

// Organizer: solo le proprie location
router.get('/organizer', authenticate, authorizeRole('organizer'), locationController.getOrganizerLocations);

// Creare una nuova location
router.post('/', authenticate, authorizeRole('organizer'), locationController.createLocation);

// Modificare una location
router.put('/:id', authenticate, authorizeRole('organizer'), locationController.updateLocation);

// Modificare orari e posti massimi di una location
router.patch('/:id/times-seats', authenticate, authorizeRole('organizer'), locationController.updateLocationTimesAndSeats);

// Eliminare una location
router.delete('/:id', authenticate, authorizeRole('organizer'), locationController.deleteLocation);

// Admin: abilitare/disabilitare una location
router.patch('/:id/status', authenticate, authorizeRole('admin'), locationController.toggleLocationStatus);

// Client: aggiungi/rimuovi location dalle preferenze
router.post('/:locationId/preference', authenticate, authorizeRole('client'), locationController.addLocationPreference);
router.delete('/:locationId/preference', authenticate, authorizeRole('client'), locationController.removeLocationPreference);

module.exports = router;
