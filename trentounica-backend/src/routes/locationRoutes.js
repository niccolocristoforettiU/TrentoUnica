const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { authenticate, authorizeRole } = require('../middlewares/authMiddleware');

// Organizer
router.get('/organizer', authenticate, authorizeRole('organizer'), locationController.getOrganizerLocations);
router.post('/', authenticate, authorizeRole('organizer'), locationController.createLocation);
router.put('/:id', authenticate, authorizeRole('organizer'), locationController.updateLocation);
router.delete('/:id', authenticate, authorizeRole('organizer'), locationController.deleteLocation);
router.patch('/:id/times-seats', authenticate, authorizeRole('organizer'), locationController.updateLocationTimesAndSeats);

// Admin
router.patch('/:id/status', authenticate, authorizeRole('admin'), locationController.toggleLocationStatus);
router.get('/', authenticate, authorizeRole('admin'), locationController.getAllLocations);

// Client preferenze
router.post('/:locationId/preference', authenticate, authorizeRole('client'), locationController.addLocationPreference);
router.delete('/:locationId/preference', authenticate, authorizeRole('client'), locationController.removeLocationPreference);

// Get all preferences of a client
router.get('/preferences', authenticate, authorizeRole('client'), locationController.getUserLocationPreferences);


module.exports = router;
