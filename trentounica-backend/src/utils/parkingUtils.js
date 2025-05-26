

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

module.exports = { findNearestParking };