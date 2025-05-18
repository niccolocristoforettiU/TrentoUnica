const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { authenticate, authorizeRole } = require('../middlewares/authMiddleware');

// Ottenere tutte le location
router.get('/', authenticate, authorizeRole('organizer'), locationController.getAllLocations);

// Creare una nuova location
router.post('/', authenticate, authorizeRole('organizer'), locationController.createLocation);

// Modificare una location
router.put('/:id', authenticate, authorizeRole('organizer'), locationController.updateLocation);

// Eliminare una location
router.delete('/:id', authenticate, authorizeRole('organizer'), locationController.deleteLocation);

module.exports = router;
