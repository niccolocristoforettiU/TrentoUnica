// src/controllers/calendarController.js
const ical = require('ical-generator').default;
const Event = require('../models/eventModel');

exports.getICalendar = async (req, res) => {
  try {
    const { startDate, endDate, category, onlyMine, onlyPreferred, onlyEventPreferred } = req.query;
    // Impedisci l'uso dei filtri avanzati da parte dei guest
    if (
      !req.user &&
      (onlyMine === 'true' || onlyPreferred === 'true' || onlyEventPreferred === 'true')
    ) {
      return res.status(403).json({ message: 'Filtri avanzati disponibili solo per utenti registrati' });
    }
    const filter = {};

    // Filtraggio per data se specificato
    if (startDate) filter.date = { $gte: new Date(startDate) };
    if (endDate) filter.date = { ...filter.date, $lte: new Date(endDate) };
    if (onlyMine === 'true' && req.user?.role === 'organizer') {
      filter.organizer = req.user.userId;
    }

    if (onlyPreferred === 'true' && req.user?.role === 'client') {
      const EventPreference = require('../models/eventPreferenceModel');
      const prefs = await EventPreference.find({ user: req.user.userId }).select('event');
      const preferredEventIds = prefs.map(p => p.event.toString());
      filter._id = { $in: preferredEventIds };
    }

    if (onlyEventPreferred === 'true' && req.user?.role === 'client') {
      const EventPreference = require('../models/eventPreferenceModel');
      const prefs = await EventPreference.find({ user: req.user.userId }).select('event');
      const preferredEventIds = prefs.map(p => p.event.toString());
      filter._id = { $in: preferredEventIds };
    }

    // Recupera gli eventi con popolazione condizionale per location in base a category
    const events = await Event.find(filter)
      .populate({
        path: 'location',
        match: category ? { category } : {}
      })
      .populate('organizer')
      .sort({ date: 1 });

    const filteredEvents = events.filter(e => e.location !== null);

    const calendar = ical({ name: 'TrentoUnica Events' });

    filteredEvents.forEach(event => {
      calendar.createEvent({
        start: event.date,
        end: new Date(event.date.getTime() + event.duration * 60 * 1000),
        summary: event.title,
        description: event.description,
        location: event.location ? event.location.name : "Senza location",
        url: `http://trentounica.onrender.com/events/${event._id}`,
      });
    });

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="events.ics"');
    res.send(calendar.toString());
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Errore nella generazione del calendario' });
  }

};

// Esporta un singolo evento come file .ics
exports.getSingleEventICalendar = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('location').populate('organizer');
    if (!event) return res.status(404).json({ message: "Evento non trovato" });

    const calendar = ical({ name: 'Evento TrentoUnica' });
    calendar.createEvent({
      start: event.date,
      end: new Date(event.date.getTime() + event.duration * 60 * 1000),
      summary: event.title,
      description: event.description,
      location: event.location?.name || "Senza location",
      url: `http://trentounica.onrender.com/events/${event._id}`,
    });

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="event-${event._id}.ics"`);
    res.send(calendar.toString());
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Errore durante l'esportazione dell'evento" });
  }
};
