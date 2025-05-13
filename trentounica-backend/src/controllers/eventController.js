// src/controllers/eventController.js
const Event = require('../models/eventModel');

// Elenco eventi
exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero degli eventi' });
  }
};

// Creazione evento
exports.createEvent = async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Errore nella creazione dell\'evento' });
  }
};

// Dettagli evento
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Evento non trovato' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero dell\'evento' });
  }
};

// Modifica evento
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) return res.status(404).json({ message: 'Evento non trovato' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Errore nella modifica dell\'evento' });
  }
};

// Eliminazione evento
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Evento non trovato' });
    res.json({ message: 'Evento eliminato con successo' });
  } catch (error) {
    res.status(500).json({ message: 'Errore nell\'eliminazione dell\'evento' });
  }
};
