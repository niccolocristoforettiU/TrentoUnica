const Location = require('../models/locationModel');
const LocationPreference = require('../models/locationPreferenceModel');

// Ottenere tutte le location (solo per admin)
const getAllLocations = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accesso negato. Solo l\'admin può visualizzare tutte le location.' });
    }
    const locations = await Location.find().populate('organizer', 'companyName email');
    res.status(200).json(locations);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero delle location', error: error.message });
  }
};

// Ottenere le location gestite dall'organizer autenticato
const getOrganizerLocations = async (req, res) => {
  try {
    const organizerId = req.user.userId;
    const locations = await Location.find({ organizer: organizerId });

    if (locations.length === 0) {
      return res.status(404).json({ message: 'Nessuna location trovata per questo organizer.' });
    }

    res.status(200).json(locations);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel caricamento delle location', error: error.message });
  }
};

// Creare una nuova location (aggiunti lat/lon)
const createLocation = async (req, res) => {
  try {
    const { name, address, lat, lon, openingTime, closingTime, maxSeats, category } = req.body;

    if (!name || !address || lat == null || lon == null || !openingTime || !closingTime || !maxSeats || !category) {
      return res.status(400).json({ message: 'Tutti i campi sono obbligatori, inclusi latitudine e longitudine.' });
    }

    const existingLocation = await Location.findOne({ name, address, organizer: req.user.userId });
    if (existingLocation) {
      return res.status(400).json({ message: 'Location già esistente' });
    }

    const location = new Location({
      name,
      address,
      lat,
      lon,
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

// Modificare una location (aggiunto lat/lon modificabili)
const updateLocation = async (req, res) => {
  try {
    const { name, address, lat, lon, openingTime, closingTime, maxSeats, category } = req.body;

    const updateFields = {
      ...(name && { name }),
      ...(address && { address }),
      ...(lat !== undefined && { lat }),
      ...(lon !== undefined && { lon }),
      ...(openingTime && { openingTime }),
      ...(closingTime && { closingTime }),
      ...(maxSeats && { maxSeats }),
      ...(category && { category })
    };

    const location = await Location.findOneAndUpdate(
      { _id: req.params.id, organizer: req.user.userId },
      updateFields,
      { new: true }
    );

    if (!location) {
      return res.status(404).json({ message: 'Location non trovata o non autorizzata' });
    }

    res.status(200).json(location);
  } catch (error) {
    res.status(500).json({ message: 'Errore nella modifica della location', error: error.message });
  }
};

// Modificare orari e posti massimi
const updateLocationTimesAndSeats = async (req, res) => {
  try {
    const { openingTime, closingTime, maxSeats } = req.body;
    if (!openingTime || !closingTime || !maxSeats) {
      return res.status(400).json({ message: 'Orari e posti massimi sono obbligatori' });
    }

    const location = await Location.findOneAndUpdate(
      { _id: req.params.id, organizer: req.user.userId },
      { openingTime, closingTime, maxSeats },
      { new: true }
    );

    if (!location) {
      return res.status(404).json({ message: 'Location non trovata o non autorizzata' });
    }

    res.status(200).json(location);
  } catch (error) {
    res.status(500).json({ message: 'Errore nella modifica degli orari e dei posti massimi', error: error.message });
  }
};

// Eliminare una location
const deleteLocation = async (req, res) => {
  try {
    const location = await Location.findOneAndDelete({ _id: req.params.id, organizer: req.user.userId });

    if (!location) {
      return res.status(404).json({ message: 'Location non trovata o non autorizzata' });
    }

    res.status(200).json({ message: 'Location eliminata con successo' });
  } catch (error) {
    res.status(500).json({ message: 'Errore nell\'eliminazione della location', error: error.message });
  }
};

// Aggiungi una location alle preferenze dell'utente
const addLocationPreference = async (req, res) => {
  try {
    const { locationId } = req.params;
    const userId = req.user.userId;

    await LocationPreference.create({ user: userId, location: locationId });
    res.status(200).json({ message: 'Location aggiunta alle preferenze.' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Location già presente nelle preferenze.' });
    }
    res.status(500).json({ message: 'Errore nel salvataggio della preferenza.', error: error.message });
  }
};

// Rimuovi una location dalle preferenze dell'utente
const removeLocationPreference = async (req, res) => {
  try {
    const { locationId } = req.params;
    const userId = req.user.userId;

    await LocationPreference.findOneAndDelete({ user: userId, location: locationId });
    res.status(200).json({ message: 'Location rimossa dalle preferenze.' });
  } catch (error) {
    res.status(500).json({ message: 'Errore nella rimozione della preferenza.', error: error.message });
  }
};

module.exports = {
  getAllLocations,
  getOrganizerLocations,
  createLocation,
  updateLocation,
  updateLocationTimesAndSeats,
  deleteLocation,
  addLocationPreference,
  removeLocationPreference
};
