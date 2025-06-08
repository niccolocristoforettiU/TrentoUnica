const Booking = require('../models/bookingModel');
const EventPreference = require('../models/eventPreferenceModel');
const Event = require('../models/eventModel');
const User = require('../models/userModel');
const Tratta = require('../models/trattaModel');
const { sendTrattaAvailableEmailToUser } = require('../services/emailService');

const axios = require('axios');

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

function groupUsersByProximity(users, radiusKm, minGroupSize) {
  const groups = [];

  const remaining = [...users];

  while (remaining.length > 0) {
    const user = remaining.shift();
    const group = [user];

    for (let i = remaining.length - 1; i >= 0; i--) {
      const candidate = remaining[i];
      const closeToAll = group.every(u =>
        haversineDistance(u.lat, u.lon, candidate.lat, candidate.lon) <= radiusKm
      );
      if (closeToAll) {
        group.push(candidate);
        remaining.splice(i, 1);
      }
    }

    if (group.length >= minGroupSize) {
      groups.push(group);
    }
  }

  return groups;
}

async function generateTratte(eventId) {
  const event = await Event.findById(eventId).populate('location');
  if (!event || !event.location || event.location.lat == null || event.location.lon == null) {
    throw new Error('Evento o coordinate mancanti');
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

  // Recupera utenti già assegnati a tratte attive per questo evento
  const existingTratte = await Tratta.find({ event: eventId });
  const alreadyAssignedUserIds = new Set();
  existingTratte.forEach(tratta => {
    tratta.users.forEach(uid => alreadyAssignedUserIds.add(uid.toString()));
  });

  const MIN_DIST = parseFloat(process.env.DIST_MIN_PER_ATTIVAZIONE_TRATTA || "50");
  const MAX_DIST = parseFloat(process.env.DIST_MAX_PER_ATTIVAZIONE_TRATTA || "5");
  const MAX_DIST_BETWEEN_USERS = parseFloat(process.env.DIST_MAX_TRA_USER || "3");
  const REQUIRED_USERS = parseInt(process.env.N_USER_UNICI_PER_ATTIVAZIONE_TRATTA || "5");

  const usersInRange = users.filter(u => {
    const dist = haversineDistance(eventCoords.lat, eventCoords.lon, u.lat, u.lon);
    return dist >= MIN_DIST && dist <= MAX_DIST && !alreadyAssignedUserIds.has(u._id.toString());
  });

  if (usersInRange.length < REQUIRED_USERS) {
    return {
      created: 0,
      updated: 0,
      message: `Solo ${usersInRange.length} utenti non assegnati entro il range (minimo richiesto: ${REQUIRED_USERS})`
    };
  }

  const groupedUsers = groupUsersByProximity(usersInRange, MAX_DIST_BETWEEN_USERS, REQUIRED_USERS);

  let created = 0;
  let updated = 0;
  let trattaIndex = 0;

  for (const group of groupedUsers) {
    const midpoint = geographicMidpoint(group);
    const avgDistance = group.reduce((sum, u) => sum + haversineDistance(midpoint.lat, midpoint.lon, u.lat, u.lon), 0) / group.length;
    // Calcolo tempo stimato (non usato per spostare la partenza ora)
    const estimatedDuration = Math.ceil((avgDistance / 40) * 60); // in minuti

    // Calcola orario di partenza: la prima parte 30 minuti prima dell'evento
    let departureTime = new Date(event.date.getTime() - 30 * 60000); // 30 min prima dell'evento

    // Le successive tratte partono ogni 30 minuti
    departureTime = new Date(departureTime.getTime() + trattaIndex * 30 * 60000);

    let matched = false;

    for (const tratta of existingTratte) {
      const allInRange = group.every(u =>
        haversineDistance(u.lat, u.lon, tratta.midpoint.lat, tratta.midpoint.lon) <= MAX_DIST_BETWEEN_USERS
      );

      if (allInRange) {
        const newUserIds = group.map(u => u._id.toString());
        const currentUserIds = tratta.users.map(id => id.toString());
        const uniqueNewUsers = newUserIds.filter(id => !currentUserIds.includes(id));

        if (uniqueNewUsers.length > 0) {
          tratta.users.push(...uniqueNewUsers);
          for (const userId of uniqueNewUsers) {
            const user = await User.findById(userId);
            if (!user) continue;

            let trattaDeparture;
            try {
              const addressObj = await getAddressFromCoordinates(tratta.midpoint.lat, tratta.midpoint.lon);
              trattaDeparture = addressObj?.address || `${tratta.midpoint.lat.toFixed(4)}, ${tratta.midpoint.lon.toFixed(4)}`;
            } catch (err) {
              console.error("Errore nel recupero indirizzo midpoint:", err.message);
              trattaDeparture = `${tratta.midpoint.lat.toFixed(4)}, ${tratta.midpoint.lon.toFixed(4)}`;
            }

            await sendTrattaAvailableEmailToUser(
              user.email,
              user.name || 'utente',
              event.title,
              tratta.date,
              trattaDeparture,
              `${event.location.name} - ${event.location.address}`
            );
          }

          await tratta.save();
          updated++;
        }

        matched = true;
        break;
      }
    }

    if (!matched) {
      await Tratta.create({
        event: eventId,
        users: group.map(u => u._id),
        midpoint,
        departureTime,
        date: event.date,
        estimatedDuration,
        capacity: process.env.BUS_CAPACITY_STANDARD,
        status: 'pending',
      });
      created++;
      trattaIndex++;
    }
  }
  return {
    created,
    updated,
    message: `Tratte processate con successo`
  };
}

const getAddressFromCoordinates = async (lat, lon) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY; // assicurati che sia nel .env
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`;
    
    const response = await axios.get(url);

    if (response.data.status === 'OK') {
      const result = response.data.results[0];
      return {
        address: result.formatted_address,
        mapsUrl: `https://www.google.com/maps?q=${lat},${lon}`
      };
    } else {
      console.error('Reverse geocoding fallito:', response.data.status);
      return null;
    }
  } catch (err) {
    console.error('Errore reverse geocoding:', err.message);
    return null;
  }
};





module.exports = {
  haversineDistance,
  allUsersWithinRadius,
  geographicMidpoint,
  groupUsersByProximity,
  generateTratte,
  getAddressFromCoordinates
};
