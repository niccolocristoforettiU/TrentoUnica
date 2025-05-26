const fs = require('fs');
const path = require('path');
const turf = require('@turf/turf');

// Percorso al file GeoJSON della ZTL
const ztlPath = path.join(__dirname, '../data/zone_traffico_limitato.geojson');
const ztlGeojson = JSON.parse(fs.readFileSync(ztlPath));

/**
 * Verifica se un punto (lat, lon) si trova all'interno della ZTL.
 * @param {number} lat - Latitudine del punto.
 * @param {number} lon - Longitudine del punto.
 * @returns {boolean} True se il punto è nella ZTL, altrimenti false.
 */
function isInZTL(lat, lon) {
  const point = turf.point([lon, lat]);
  return ztlGeojson.features.some(feature => turf.booleanPointInPolygon(point, feature));
}

module.exports = { isInZTL };