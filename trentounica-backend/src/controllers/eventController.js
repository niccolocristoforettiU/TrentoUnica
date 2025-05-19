// src/controllers/eventController.js
const Event = require('../models/eventModel');
const fs = require('fs');
const path = require('path');
const Location = require('../models/locationModel');

// Elenco eventi (pubblici)
exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate('location', 'name address')
      .populate('organizer', 'companyName email');
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero degli eventi' });
  }
};

// Creazione evento con verifica permessi location e categoria
exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, locationId, price, category } = req.body;
    const userId = req.user.userId;

    // Verifica se la location esiste nel database MongoDB e se è gestita dall'organizer
    const loc = await Location.findOne({ _id: locationId, organizer: userId });
    if (!loc) {
      return res.status(400).json({ message: 'Location non valida o non gestita da questo organizer.' });
    }

    const event = new Event({
      title,
      description,
      date,
      location: loc._id,
      price,
      organizer: userId,
      category
    });

    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Errore durante la creazione dell\'evento', error: error.message });
  }
};

// Ottenere tutte le location disponibili per la creazione degli eventi
exports.getLocations = (req, res) => {
  try {
    const locationsPath = path.join(__dirname, '../../data/locations.json');
    const locations = JSON.parse(fs.readFileSync(locationsPath, 'utf-8'));
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero delle locations' });
  }
};

// Dettagli evento
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('location', 'name address')
      .populate('organizer', 'companyName email');
    if (!event) return res.status(404).json({ message: 'Evento non trovato' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero dell\'evento' });
  }
};

// Modifica evento
exports.updateEvent = async (req, res) => {
  try {
    const { title, description, date, locationId, price, category } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Evento non trovato' });

    // Verifica la location sia nel JSON che nel database
    const locationsPath = path.join(__dirname, '../../data/locations.json');
    const locations = JSON.parse(fs.readFileSync(locationsPath, 'utf-8'));
    const location = locations.find(loc => loc.locationId === locationId);
    const loc = await Location.findById(locationId);

    if (!location && !loc) {
      return res.status(400).json({ message: 'Location non valida.' });
    }

    // Verifica permessi organizer (solo per location da JSON)
    if (location && !location.allowedOrganizers.includes(req.user.userId)) {
      return res.status(403).json({ message: 'Non autorizzato a modificare eventi in questa location' });
    }

    event.title = title;
    event.description = description;
    event.date = date;
    event.location = loc ? loc._id : location.name;
    event.locationId = locationId;
    event.price = price;
    event.category = loc ? loc.category : location.category;

    await event.save();
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Errore durante l\'aggiornamento dell\'evento', error: error.message });
  }
};

// Eliminazione evento
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Evento non trovato' });

    // Verifica che l'organizer sia il proprietario dell'evento
    if (event.organizer.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Non autorizzato a eliminare questo evento' });
    }

    await event.remove();
    res.json({ message: 'Evento eliminato con successo' });
  } catch (error) {
    res.status(500).json({ message: 'Errore durante l\'eliminazione dell\'evento' });
  }
};