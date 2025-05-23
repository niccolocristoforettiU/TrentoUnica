const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { authenticate, authorizeRole } = require('../middlewares/authMiddleware');

// Organizer: tutte le location
router.get('/', authenticate, authorizeRole('organizer'), locationController.getAllLocations);

// Organizer: solo le proprie location
router.get('/organizer', authenticate, authorizeRole('organizer'), locationController.getOrganizerLocations);

// Client/Admin: location con eventi filtrati per data/categoria
router.get('/with-events', authenticate, authorizeRole(['client', 'admin']), async (req, res) => {
  const { startDate, endDate, category } = req.query;

  try {
    const match = {};
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) match.date.$lte = new Date(endDate);
    }

    const locations = await require('../models/locationModel').find()
      .populate({
        path: "events",
        match,
        select: "date title category"
      });

    // Filtra solo le location con almeno un evento
    const filtered = locations.filter(loc => loc.events && loc.events.length > 0);

    // Eventuale filtro per categoria della location stessa
    const finalFiltered = category
      ? filtered.filter(loc => loc.category === category)
      : filtered;

    res.json(finalFiltered);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Errore nel recupero delle location con eventi" });
  }
});

// Creare una nuova location
router.post('/', authenticate, authorizeRole('organizer'), locationController.createLocation);

// Modificare una location
router.put('/:id', authenticate, authorizeRole('organizer'), locationController.updateLocation);

// Modificare orari e posti massimi di una location
router.patch('/:id/times-seats', authenticate, authorizeRole('organizer'), locationController.updateLocationTimesAndSeats);

// Eliminare una location
router.delete('/:id', authenticate, authorizeRole('organizer'), locationController.deleteLocation);

module.exports = router;
