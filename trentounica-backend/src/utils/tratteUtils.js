const Booking = require('../models/bookingModel');
const EventPreference = require('../models/eventPreferenceModel');
const Event = require('../models/eventModel');
const User = require('../models/userModel');
const Location = require('../models/locationModel');

const toRad = deg => deg * Math.PI / 180;
const toDeg = rad => rad * 180 / Math.PI;

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function allUsersWithinRadius(users, radiusKm = 3) {
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      const dist = haversineDistance(
        users[i].lat, users[i].lon,
        users[j].lat, users[j].lon
      );
      if (dist > radiusKm) return false;
    }
  }
  return true;
}

function geographicMidpoint(users) {
  let x = 0, y = 0, z = 0;

  users.forEach(({ lat, lon }) => {
    const latRad = toRad(lat);
    const lonRad = toRad(lon);
    x += Math.cos(latRad) * Math.cos(lonRad);
    y += Math.cos(latRad) * Math.sin(lonRad);
    z += Math.sin(latRad);
  });

  const total = users.length;
  x /= total;
  y /= total;
  z /= total;

  const lon = Math.atan2(y, x);
  const hyp = Math.sqrt(x * x + y * y);
  const lat = Math.atan2(z, hyp);

  return { lat: toDeg(lat), lon: toDeg(lon) };
}

async function checkTrattaConditionsForEvent(eventId) {
  const event = await Event.findById(eventId).populate('location');
  if (!event || !event.location || event.location.lat == null || event.location.lon == null) {
    console.log(" Evento o location con coordinate mancanti");
    return;
  }

  const eventCoords = { lat: event.location.lat, lon: event.location.lon };

  const bookingUsers = await Booking.find({
    event: eventId,
    status: 'confirmed',
    paymentStatus: 'paid'
  }).distinct('user');

  const preferenceUsers = await EventPreference.find({ event: eventId }).distinct('user');
  const allUserIds = [...new Set([...bookingUsers, ...preferenceUsers].map(id => id.toString()))];

  const users = await User.find({
    _id: { $in: allUserIds },
    lat: { $ne: null },
    lon: { $ne: null }
  });

  const MIN_DIST = parseFloat(process.env.DIST_MIN_PER_ATTIVAZIONE_TRATTA || "50");
  const MAX_DIST = parseFloat(process.env.DIST_MAX_PER_ATTIVAZIONE_TRATTA || "5");
  const MAX_DIST_BETWEEN_USERS = parseFloat(process.env.DIST_MAX_TRA_USER || "2");
  const REQUIRED_USERS = parseInt(process.env.N_USER_UNICI_PER_ATTIVAZIONE_TRATTA || "5");

  // Filter users by distance from event location
  const usersInRange = users.filter(u => {
    const dist = haversineDistance(eventCoords.lat, eventCoords.lon, u.lat, u.lon);
    return dist >= MIN_DIST && dist <= MAX_DIST;
  });

  if (usersInRange.length >= REQUIRED_USERS) {
    const allClose = allUsersWithinRadius(usersInRange, MAX_DIST_BETWEEN_USERS);
    if (allClose) {
      console.log("Tratta attivabile per evento ${eventId} con ${usersInRange.length} utenti validi e ravvicinati");
    } else {
      console.log("Utenti vicini all'evento ma troppo distanti tra loro (> ${MAX_DIST_BETWEEN_USERS} km)");
    }
  } else {
    console.log("Solo ${usersInRange.length} utenti entro range evento (minimo richiesto: ${REQUIRED_USERS})");
  }
}

module.exports = {
  haversineDistance,
  allUsersWithinRadius,
  geographicMidpoint,
  checkTrattaConditionsForEvent
};
