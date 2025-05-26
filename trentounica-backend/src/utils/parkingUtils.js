

const fs = require('fs');
const path = require('path');
const turf = require('@turf/turf');
const { isInZTL } = require('./ztlUtils');

// Carica i dati GeoJSON dei parcheggi
const parkingPath = path.join(__dirname, '../data/parking_locations.geojson');
const parkingData = JSON.parse(fs.readFileSync(parkingPath));

/**
 * Trova il parcheggio più vicino fuori dalla ZTL.
 * @param {Object} to - Oggetto con lat e lon della destinazione.
 * @returns {Object|null} - Punto parcheggio {lat, lon} o null se nessuno disponibile.
 */
function findNearestParking(to) {
  const destination = turf.point([to.lon, to.lat]);

  const validParkings = parkingData.features
    .filter(f => f.geometry.type === 'Point')
    .map(f => ({
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
      distance: turf.distance(destination, turf.point(f.geometry.coordinates), { units: 'kilometers' })
    }))
    .filter(p => !isInZTL(p.lat, p.lon));

  if (validParkings.length === 0) return null;

  validParkings.sort((a, b) => a.distance - b.distance);
  return { lat: validParkings[0].lat, lon: validParkings[0].lon };
}

/**
 * Assegna utenti ai parcheggi più vicini fuori dalla ZTL.
 * @param {Object} destination - Oggetto con lat e lon dell'evento.
 * @param {number} nUsers - Numero di utenti da distribuire.
 * @returns {Array<{parking: {lat: number, lon: number}, assigned: number}>}
 */
function assignParkingSpots(destination, nUsers) {
  const destinationPoint = turf.point([destination.lon, destination.lat]);

  const candidates = parkingData.features
    .filter(f => f.geometry.type === 'Point')
    .map(f => {
      const lat = f.geometry.coordinates[1];
      const lon = f.geometry.coordinates[0];
      const capacity = f.properties?.capacity || 7;
      const distance = turf.distance(destinationPoint, turf.point([lon, lat]), { units: 'kilometers' });
      return { lat, lon, capacity, distance };
    })
    .filter(p => !isInZTL(p.lat, p.lon))
    .sort((a, b) => a.distance - b.distance);

  const assignments = [];
  let remaining = nUsers;

  for (const p of candidates) {
    if (remaining <= 0) break;
    const assigned = Math.min(p.capacity, remaining);
    assignments.push({ parking: { lat: p.lat, lon: p.lon }, assigned });
    remaining -= assigned;
  }

  return assignments;
}

module.exports = { findNearestParking, assignParkingSpots };