const Booking = require('../models/bookingModel');
const Event = require('../models/eventModel');
const EventPreference = require('../models/eventPreferenceModel');
const User = require('../models/userModel');
const { getStreetRoute, getPostEventWalkRoutes } = require('../utils/routingUtils');

// Utile per calcolare età da birthDate
const calculateAge = (birthDate) => {
  const ageDifMs = Date.now() - birthDate.getTime();
  return Math.floor(ageDifMs / (1000 * 60 * 60 * 24 * 365.25));
};

// Endpoint: GET /admin/stats/flows?date=YYYY-MM-DD
exports.getEstimatedFlows = async (req, res) => {
  try {
    const date = new Date(req.query.date);
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);

    // Optional hour filter
    const startHour = req.query.startHour ? parseInt(req.query.startHour) : null;
    const endHour = req.query.endHour ? parseInt(req.query.endHour) : null;
    if (startHour !== null || endHour !== null) {
      if (startHour !== null) {
        date.setHours(startHour, 0, 0, 0);
      }
      if (endHour !== null) {
        nextDay.setTime(date.getTime());
        nextDay.setHours(endHour !== null ? endHour : 23, 59, 59, 999);
      }
    } else {
      nextDay.setDate(date.getDate() + 1);
    }

    const allEvents = await Event.find({ date: { $gte: date, $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000) } })
      .populate('location', 'lat lon name');

    // Calcola l'intervallo orario da usare per il filtro
    const filterStart = startHour !== null ? new Date(new Date(req.query.date).setHours(startHour, 0, 0, 0)) : new Date(date.setHours(0, 0, 0, 0));
    const filterEnd = endHour !== null ? new Date(new Date(req.query.date).setHours(endHour, 0, 0, 0)) : new Date(date.setHours(23, 59, 59, 999));

    // Filtra gli eventi in base alla sovrapposizione tra intervallo evento e intervallo filtro
    const events = allEvents.filter(event => {
      const eventStart = new Date(event.date);
      const eventEnd = new Date(eventStart.getTime() + event.duration * 60000);
      return eventStart < filterEnd && eventEnd > filterStart;
    });

    const bookings = await Booking.find({
      event: { $in: events.map(e => e._id) },
      status: 'confirmed',
      paymentStatus: 'paid'
    }).populate('user', 'lat lon');

    const preferences = await EventPreference.find({
      event: { $in: events.map(e => e._id) }
    }).populate('user', 'lat lon');

    const flows = [];

    // Flussi da booking (presenza con percentuale 0.9)
    for (const b of bookings) {
      const event = events.find(e => e._id.toString() === b.event.toString());
      if (event && b.user?.lat && b.user?.lon && event.location?.lat && event.location?.lon) {
        const from = { lat: b.user.lat, lon: b.user.lon };
        const to = { lat: event.location.lat, lon: event.location.lon };
        const route = await getStreetRoute(from, to);
        flows.push({ route, weight: 0.9 });
        const postFlows = await getPostEventWalkRoutes(to);
        flows.push(...postFlows);
      }
    }

    // Flussi da preferenze (presenza stimata al 55%)
    for (const p of preferences) {
      const event = events.find(e => e._id.toString() === p.event.toString());
      if (event && p.user?.lat && p.user?.lon && event.location?.lat && event.location?.lon) {
        const from = { lat: p.user.lat, lon: p.user.lon };
        const to = { lat: event.location.lat, lon: event.location.lon };
        const route = await getStreetRoute(from, to);
        flows.push({ route, weight: (0.55) });
        const postFlows = await getPostEventWalkRoutes(to);
        flows.push(...postFlows);
      }
    }

    res.json({ date: req.query.date, flows });
  } catch (error) {
    res.status(500).json({ message: 'Errore nel calcolo dei flussi stimati', error: error.message });
  }
};

// Endpoint: GET /admin/stats/histogram?date=YYYY-MM-DD
exports.getEventHistogram = async (req, res) => {
  try {
    const date = new Date(req.query.date);
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);

    const events = await Event.find({ date: { $gte: date, $lt: nextDay } })
      .populate('location', 'name');

    const bookings = await Booking.find({
      event: { $in: events.map(e => e._id) },
      status: 'confirmed',
      paymentStatus: 'paid'
    }).populate('user', 'birthDate');

    const preferences = await EventPreference.find({
      event: { $in: events.map(e => e._id) }
    }).populate('user', 'birthDate');

    const histogram = [];

    for (const event of events) {
      const eventData = {
        eventId: event._id,
        title: event.title,
        location: event.location?.name,
        ageGroups: {
          '0-17': 0,
          '18-30': 0,
          '31-45': 0,
          '46-60': 0,
          '60+': 0
        }
      };

      const ageGroup = (age) => {
        if (age < 18) return '0-17';
        if (age <= 30) return '18-30';
        if (age <= 45) return '31-45';
        if (age <= 60) return '46-60';
        return '60+';
      };

      // Prenotati (0.9)
      bookings
        .filter(b => b.event.toString() === event._id.toString() && b.user?.birthDate)
        .forEach(b => {
          const age = calculateAge(new Date(b.user.birthDate));
          const group = ageGroup(age);
          eventData.ageGroups[group] += 0.9;
        });

      // Preferiti (peso parziale, 0.6)
      preferences
        .filter(p => p.event.toString() === event._id.toString() && p.user?.birthDate)
        .forEach(p => {
          const age = calculateAge(new Date(p.user.birthDate));
          const group = ageGroup(age);
          eventData.ageGroups[group] += 0.6;
        });

      // Arrotonda i gruppi di età a interi
      for (const group in eventData.ageGroups) {
        eventData.ageGroups[group] = Math.round(eventData.ageGroups[group]);
      }

      histogram.push(eventData);
    }

    res.json({ date: req.query.date, histogram });
  } catch (error) {
    res.status(500).json({ message: 'Errore nel calcolo dell\'istogramma', error: error.message });
  }
};
