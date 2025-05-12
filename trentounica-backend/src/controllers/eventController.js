// src/controllers/eventController.js
const Event = require('../models/eventModel');

// Elenco eventi
exports.getAllEvents = async (req, res) => {
  const events = await Event.find();
  res.json(events);
};

// Creazione evento
exports.createEvent = async (req, res) => {
  const event = new Event(req.body);
  await event.save();
  res.status(201).json(event);
};