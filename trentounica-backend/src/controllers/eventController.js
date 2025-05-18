// src/controllers/eventController.js
const Event = require('../models/eventModel');
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

// Creazione evento
exports.createEvent = async (req, res) => {
  try {
    const { location, ...eventData } = req.body;

    // Verifica che la location esista
    const loc = await Location.findById(location);
    if (!loc) {
      return res.status(404).json({ message: 'Location non trovata' });
    }

    // Verifica che l'organizer sia proprietario della location
    if (loc.organizer.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Non autorizzato a creare eventi in questa location' });
    }

    const event = new Event({ ...eventData, location, organizer: req.user.userId });
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Errore nella creazione dell\'evento', error: error.message });
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
    const { location, ...eventData } = req.body;

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Evento non trovato' });

    // Verifica che la location esista
    const loc = await Location.findById(location);
    if (!loc) {
      return res.status(404).json({ message: 'Location non trovata' });
    }

    // Verifica che l'organizer sia proprietario della location
    if (loc.organizer.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Non autorizzato a modificare eventi in questa location' });
    }

    event.set({ ...eventData, location });
    await event.save();
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Errore nella modifica dell\'evento', error: error.message });
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
    res.status(500).json({ message: 'Errore nell\'eliminazione dell\'evento' });
  }
};