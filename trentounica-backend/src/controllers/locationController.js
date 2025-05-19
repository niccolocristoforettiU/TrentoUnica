const Location = require('../models/locationModel');

// Ottenere tutte le location
exports.getAllLocations = async (req, res) => {
  try {
    const locations = await Location.find().populate('organizer', 'companyName email');
    res.status(200).json(locations);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero delle location', error: error.message });
  }
};

// Creare una nuova location
exports.createLocation = async (req, res) => {
  try {
    const { name, address, openingTime, closingTime, maxSeats, category } = req.body;

    if (!name || !address || !openingTime || !closingTime || !maxSeats || !category) {
      return res.status(400).json({ message: 'Tutti i campi sono obbligatori, incluso la categoria.' });
    }

    const existingLocation = await Location.findOne({ name, address, organizer: req.user.userId });
    if (existingLocation) {
      return res.status(400).json({ message: 'Location già esistente' });
    }

    const location = new Location({
      name,
      address,
      openingTime,
      closingTime,
      maxSeats,
      category,
      organizer: req.user.userId
    });

    await location.save();
    res.status(201).json(location);
  } catch (error) {
    res.status(500).json({ message: 'Errore nella creazione della location', error: error.message });
  }
};

// Modificare una location
exports.updateLocation = async (req, res) => {
  try {
    const { name, address, openingTime, closingTime, maxSeats } = req.body;
    const location = await Location.findByIdAndUpdate(
      req.params.id,
      { name, address, openingTime, closingTime, maxSeats },
      { new: true }
    );
    if (!location) {
      return res.status(404).json({ message: 'Location non trovata' });
    }
    res.status(200).json(location);
  } catch (error) {
    res.status(500).json({ message: 'Errore nella modifica della location', error: error.message });
  }
};

// Modificare orari e posti massimi di una location
exports.updateLocationTimesAndSeats = async (req, res) => {
  try {
    const { openingTime, closingTime, maxSeats } = req.body;
    if (!openingTime || !closingTime || !maxSeats) {
      return res.status(400).json({ message: 'Orari e posti massimi sono obbligatori' });
    }
    const location = await Location.findByIdAndUpdate(
      req.params.id,
      { openingTime, closingTime, maxSeats },
      { new: true }
    );
    if (!location) {
      return res.status(404).json({ message: 'Location non trovata' });
    }
    res.status(200).json(location);
  } catch (error) {
    res.status(500).json({ message: 'Errore nella modifica degli orari e dei posti massimi', error: error.message });
  }
};

// Eliminare una location
exports.deleteLocation = async (req, res) => {
  try {
    await Location.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Location eliminata con successo' });
  } catch (error) {
    res.status(500).json({ message: 'Errore nell eliminazione della location', error: error.message });
  }
};