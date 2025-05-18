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
    const { name, address } = req.body;

    const existingLocation = await Location.findOne({ name, address });
    if (existingLocation) {
      return res.status(400).json({ message: 'Location già esistente' });
    }

    const location = new Location({
      name,
      address,
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
    const { name, address } = req.body;
    const location = await Location.findByIdAndUpdate(req.params.id, { name, address }, { new: true });
    res.status(200).json(location);
  } catch (error) {
    res.status(500).json({ message: 'Errore nella modifica della location', error: error.message });
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