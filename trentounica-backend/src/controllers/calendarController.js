// src/controllers/calendarController.js
const ical = require('ical-generator');
const Event = require('../models/eventModel');

exports.getICalendar = async (req, res) => {
  try {
    const events = await Event.find({ isPublic: true }); // Solo eventi pubblici

    const calendar = ical({ name: 'TrentoUnica Events' });

    events.forEach(event => {
      calendar.createEvent({
        start: event.date,
        end: new Date(event.date.getTime() + 2 * 60 * 60 * 1000), // Durata di 2 ore
        summary: event.title,
        description: event.description,
        location: event.location,
        url: `http://localhost:8080/events/${event._id}`,
      });
    });

    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', 'attachment; filename="events.ics"');
    calendar.serve(res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Errore nella generazione del calendario' });
  }
};
