const Booking = require('../models/bookingModel');
const Event = require('../models/eventModel');
const EventPreference = require('../models/eventPreferenceModel');
const Tratta = require('../models/trattaModel');
const TrattaBooking = require('../models/trattaBooking');
const LocationPreference = require('../models/locationPreferenceModel');
const Location = require('../models/locationModel');

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

// Aggiungi una location alle preferenze dell'utente
const addLocationPreference = async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'Solo utenti registrati possono esprimere preferenze sulle location.' });
    }

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
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'Solo utenti registrati possono rimuovere preferenze sulle location.' });
    }

    const { locationId } = req.params;
    const userId = req.user.userId;

    await LocationPreference.findOneAndDelete({ user: userId, location: locationId });
    res.status(200).json({ message: 'Location rimossa dalle preferenze.' });
  } catch (error) {
    res.status(500).json({ message: 'Errore nella rimozione della preferenza.', error: error.message });
  }
};

const toggleLocationStatus = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accesso negato. Solo l\'admin può modificare lo stato della location.' });
    }

    const { id } = req.params;
    const { enabled } = req.body;

    const location = await Location.findByIdAndUpdate(
      id,
      { enabled },
      { new: true }
    );

    if (!location) {
      return res.status(404).json({ message: 'Location non trovata' });
    }

    if (!enabled) {
      await Event.deleteMany({ location: id });
    }

    res.status(200).json({ message: `Location ${enabled ? 'attivata' : 'disabilitata'} con successo`, location });
  } catch (err) {
    res.status(500).json({ message: 'Errore nella modifica dello stato della location', error: err.message });
  }
};

// Ottenere tutte le location preferite di un utente
const getUserLocationPreferences = async (req, res) => {
  try {
    const preferences = await LocationPreference.find({ user: req.user.userId }).populate('location');
    const locations = preferences.map(pref => pref.location);
    res.status(200).json(locations);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero delle preferenze', error: error.message });
  }
};



const deleteLocation = async (req, res) => {
  try {
    const organizerId = req.user.userId;
    const locationId = req.params.id;

    // Verifica se la location esiste e appartiene all'organizer
    const location = await Location.findOne({ _id: locationId, organizer: organizerId });
    if (!location) {
      return res.status(404).json({ message: 'Location non trovata o non autorizzata' });
    }

    // Trova gli eventi nella location
    const events = await Event.find({ location: locationId });
    const eventIds = events.map(event => event._id);

    // Trova le tratte collegate agli eventi
    const tratte = await Tratta.find({ event: { $in: eventIds } });
    const trattaIds = tratte.map(t => t._id);

    // Elimina le prenotazioni per eventi
    await Booking.deleteMany({ event: { $in: eventIds } });

    // Elimina preferenze per quegli eventi
    await EventPreference.deleteMany({ event: { $in: eventIds } });

    // Elimina prenotazioni tratte
    await TrattaBooking.deleteMany({ tratta: { $in: trattaIds } });

    // Elimina tratte
    await Tratta.deleteMany({ _id: { $in: trattaIds } });

    // Elimina eventi
    await Event.deleteMany({ _id: { $in: eventIds } });

    // Elimina location preferences
    await LocationPreference.deleteMany({ location: locationId });

    // Infine, elimina la location
    await Location.deleteOne({ _id: locationId });

    res.status(200).json({ message: 'Location e dati correlati eliminati con successo' });
  } catch (error) {
    console.error('Errore durante la cancellazione completa:', error);
    res.status(500).json({ message: 'Errore nella cancellazione della location', error: error.message });
  }
};

module.exports = {
  getAllLocations,
  getOrganizerLocations,
  createLocation,
  updateLocation,
  updateLocationTimesAndSeats,
  addLocationPreference,
  removeLocationPreference,
  toggleLocationStatus,
  getUserLocationPreferences,
  deleteLocation
};
