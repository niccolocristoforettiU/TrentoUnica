const { assignParkingSpots } = require('../utils/parkingUtils');
const Booking = require('../models/bookingModel');
const Event = require('../models/eventModel');
const EventPreference = require('../models/eventPreferenceModel');
const User = require('../models/userModel');
const { getStreetRoute } = require('../utils/routingUtils');
const { getRouteSegment } = require('../utils/osrmUtils');

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

    for (const event of events) {
      const eventBookings = bookings.filter(b => b.event.toString() === event._id.toString());
      const eventPreferences = preferences.filter(p => p.event.toString() === event._id.toString());
      const users = [
        ...eventBookings.map(b => ({ user: b.user, weight: 0.9 })),
        ...eventPreferences.map(p => ({ user: p.user, weight: 0.55 }))
      ].filter(u => u.user?.lat && u.user?.lon);

      const assigned = assignParkingSpots({ lat: event.location.lat, lon: event.location.lon }, users.length);
      let userIndex = 0;

      for (const { parking, assigned: count } of assigned) {
        for (let i = 0; i < count; i++) {
          const u = users[userIndex++];
          if (!u) continue;
          const from = { lat: u.user.lat, lon: u.user.lon };
          const to = { lat: event.location.lat, lon: event.location.lon };

          const drivingRoute = await getRouteSegment(from, parking, 'driving');
          const walkingRoute = (parking.lat === to.lat && parking.lon === to.lon)
            ? []
            : await getRouteSegment(parking, to, 'walking');
          const postWalk = await getRouteSegment(to, {
            lat: to.lat + (Math.random() - 0.5) * 0.001,
            lon: to.lon + (Math.random() - 0.5) * 0.001
          }, 'walking');

          flows.push({
            route: drivingRoute.map(p => ({ ...p, mode: 'driving' })),
            weight: u.weight,
            mode: 'driving',
            type: 'to_event',
            eventStart: event.date,
            eventEnd: new Date(event.date.getTime() + event.duration * 60000)
          });
          if (walkingRoute.length > 0) {
            flows.push({
              route: walkingRoute.map(p => ({ ...p, mode: 'walking' })),
              weight: u.weight,
              mode: 'walking',
              type: 'to_event',
              eventLocationName: event.location.name,
              eventStart: event.date,
              eventEnd: new Date(event.date.getTime() + event.duration * 60000)
            });
          }
          flows.push({
            route: postWalk.map(p => ({ ...p, mode: 'walking' })),
            weight: 0.2,
            mode: 'walking',
            type: 'from_event',
            eventStart: event.date,
            eventEnd: new Date(event.date.getTime() + event.duration * 60000)
          });
        }
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
        startDate: event.date,
        endDate: new Date(event.date.getTime() + event.duration * 60000),
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
