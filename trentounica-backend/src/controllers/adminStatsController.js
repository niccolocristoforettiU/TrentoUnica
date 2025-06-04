const flowJobs = new Map(); // jobId => { progress, status, result }
const crypto = require('crypto');
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

    function generateRandomGuestPosition() {
      const center = { lat: 46.0679, lon: 11.1211 }; // Centro Trento
      const radius = 5; // ~5 km
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * radius;
      return {
        lat: center.lat + (Math.cos(angle) * distance) / 111,
        lon: center.lon + (Math.sin(angle) * distance) / (111 * Math.cos(center.lat * Math.PI / 180))
      };
    }

    const flows = [];

    //Route cache and helper
    const routeCache = new Map();

    async function getCachedRoute(from, to, mode) {
      const key = `${from.lat},${from.lon}_${to.lat},${to.lon}_${mode}`;
      if (routeCache.has(key)) return routeCache.get(key);
      const route = await getRouteSegment(from, to, mode);
      routeCache.set(key, route);
      return route;
    }

    for (const event of events) {
      const eventBookings = bookings.filter(b => b.event.toString() === event._id.toString());
      const eventPreferences = preferences.filter(p => p.event.toString() === event._id.toString());
      const users = [
        ...eventBookings.map(b => ({ user: b.user, weight: 0.9 })),
        ...eventPreferences.map(p => ({
          user: p.user || generateRandomGuestPosition(),
          weight: 0.55
        }))
      ];

      const assigned = assignParkingSpots({ lat: event.location.lat, lon: event.location.lon }, users.length);
      let userIndex = 0;

      for (const { parking, assigned: count } of assigned) {
        for (let i = 0; i < count; i++) {
          const u = users[userIndex++];
          if (!u) continue;
          const from = { lat: u.user.lat, lon: u.user.lon };
          const to = { lat: event.location.lat, lon: event.location.lon };

          const drivingRoute = await getCachedRoute(from, parking, 'driving');
          const walkingRoute = (parking.lat === to.lat && parking.lon === to.lon)
            ? []
            : await getCachedRoute(parking, to, 'walking');
          const postWalkTarget = {
            lat: to.lat + (Math.random() - 0.5) * 0.001,
            lon: to.lon + (Math.random() - 0.5) * 0.001
          };
          const postWalk = await getCachedRoute(to, postWalkTarget, 'walking');

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

// Endpoint: POST /admin/stats/flows/async
exports.startFlowGeneration = async (req, res) => {
  const jobId = crypto.randomUUID();
  flowJobs.set(jobId, { progress: 0, status: 'in_progress', result: null });

  const { date, startHour, endHour } = req.body;
  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);

  (async () => {
    try {
      const nextDay = new Date(dateObj);
      if (startHour !== null && startHour !== undefined) {
        dateObj.setHours(startHour, 0, 0, 0);
      }
      if (endHour !== null && endHour !== undefined) {
        nextDay.setTime(dateObj.getTime());
        nextDay.setHours(endHour, 59, 59, 999);
      } else {
        nextDay.setDate(dateObj.getDate() + 1);
      }

      const allEvents = await Event.find({ date: { $gte: dateObj, $lt: nextDay } })
        .populate('location', 'lat lon name');

      const filterStart = startHour !== null ? new Date(new Date(date).setHours(startHour, 0, 0, 0)) : new Date(dateObj.setHours(0, 0, 0, 0));
      const filterEnd = endHour !== null ? new Date(new Date(date).setHours(endHour, 0, 0, 0)) : new Date(dateObj.setHours(23, 59, 59, 999));

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

      const generateRandomGuestPosition = () => {
        const center = { lat: 46.0679, lon: 11.1211 };
        const radius = 5;
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * radius;
        return {
          lat: center.lat + (Math.cos(angle) * distance) / 111,
          lon: center.lon + (Math.sin(angle) * distance) / (111 * Math.cos(center.lat * Math.PI / 180))
        };
      };

      const flows = [];
      let processed = 0;
      const total = events.length;

      for (const event of events) {
        const eventBookings = bookings.filter(b => b.event.toString() === event._id.toString());
        const eventPreferences = preferences.filter(p => p.event.toString() === event._id.toString());
        const users = [
          ...eventBookings.map(b => ({ user: b.user, weight: 0.9 })),
          ...eventPreferences.map(p => ({
            user: p.user || generateRandomGuestPosition(),
            weight: 0.55
          }))
        ];

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
            // Progress update after push
            {
              const job = flowJobs.get(jobId);
              if (job && job.status === 'in_progress') {
                const estimatedTotalSteps = Math.max(1, total); // evita divisione per zero
                job.progress = Math.min(99, Math.floor(((processed + i / count) / estimatedTotalSteps) * 100));
              }
            }
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
              // Progress update after push
              {
                const job = flowJobs.get(jobId);
                if (job && job.status === 'in_progress') {
                  const estimatedTotalSteps = Math.max(1, total);
                  job.progress = Math.min(99, Math.floor(((processed + i / count) / estimatedTotalSteps) * 100));
                }
              }
            }
            flows.push({
              route: postWalk.map(p => ({ ...p, mode: 'walking' })),
              weight: 0.2,
              mode: 'walking',
              type: 'from_event',
              eventStart: event.date,
              eventEnd: new Date(event.date.getTime() + event.duration * 60000)
            });
            // Progress update after push
            {
              const job = flowJobs.get(jobId);
              if (job && job.status === 'in_progress') {
                const estimatedTotalSteps = Math.max(1, total);
                job.progress = Math.min(99, Math.floor(((processed + i / count) / estimatedTotalSteps) * 100));
              }
            }
          }
        }

        processed++;
        flowJobs.get(jobId).progress = Math.floor((processed / total) * 100);
      }

      flowJobs.set(jobId, { progress: 100, status: 'done', result: flows });
    } catch (err) {
      flowJobs.set(jobId, { progress: 100, status: 'error', result: null });
      console.error('Errore nella generazione flussi async:', err);
    }
  })();

  res.json({ jobId });
};

// Endpoint: GET /admin/stats/flows/async/:jobId/progress
exports.getFlowProgress = (req, res) => {
  const job = flowJobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job non trovato' });
  }
  res.json({ progress: job.progress, status: job.status });
};

// Endpoint: GET /admin/stats/flows/async/:jobId/result
exports.getFlowResult = (req, res) => {
  const job = flowJobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job non trovato' });
  }
  if (job.status !== 'done') {
    return res.status(400).json({ error: 'Il job non è ancora completato' });
  }
  res.json({ flows: job.result });
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
          '60+': 0,
          'undefined': 0
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
        .filter(b => b.event.toString() === event._id.toString())
        .forEach(b => {
          let group = 'undefined';
          if (b.user?.birthDate) {
            const age = calculateAge(new Date(b.user.birthDate));
            group = ageGroup(age);
          }
          if (!eventData.ageGroups[group]) eventData.ageGroups[group] = 0;
          eventData.ageGroups[group] += 0.9;
        });

      // Preferiti (peso parziale, 0.6)
      preferences
        .filter(p => p.event.toString() === event._id.toString())
        .forEach(p => {
          let group = 'undefined';
          if (p.user?.birthDate) {
            const age = calculateAge(new Date(p.user.birthDate));
            group = ageGroup(age);
          }
          if (!eventData.ageGroups[group]) eventData.ageGroups[group] = 0;
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
