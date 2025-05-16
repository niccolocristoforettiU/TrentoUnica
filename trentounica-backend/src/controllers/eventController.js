// src/controllers/eventController.js
const Event = require('../models/eventModel');
const fs = require('fs');
const path = require('path');

// Caricamento delle location dal file JSON
const locationsPath = path.join(__dirname, '../data/locations.json');
const locations = JSON.parse(fs.readFileSync(locationsPath, 'utf-8'));

// Elenco eventi
exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero degli eventi' });
  }
};

// Creazione evento con verifica permessi location e categoria
exports.createEvent = async (req, res) => {
  try {
    if (req.user.role !== 'organizer') {
      return res.status(403).json({ message: 'Accesso negato. Solo gli organizer possono creare eventi.' });
    }

    const { title, description, date, locationId, price, category } = req.body;
    const userId = req.user.userId;

    // Verifica se la location esiste e se l'organizer ha i permessi
    const location = locations.find(loc => loc.locationId === locationId);
    if (!location) {
      return res.status(400).json({ message: 'Location non valida.' });
    }

    if (!location.allowedOrganizers.includes(userId)) {
      return res.status(403).json({ message: 'Accesso negato. Non hai il permesso di organizzare eventi in questa location.' });
    }

    if (category && location.category !== category) {
      return res.status(400).json({ message: 'La categoria dell\'evento non corrisponde a quella della location.' });
    }

    const event = new Event({
      title,
      description,
      date,
      location: location.name,
      locationId,
      price,
      organizer: userId,
      category: location.category
    });

    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Errore durante la creazione dell\'evento', error: error.message });
  }
};
