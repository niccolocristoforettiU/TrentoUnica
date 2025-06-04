const axios = require('axios');

const routeCache = new Map();

/**
 * Calcola il percorso tra due coordinate usando OSRM.
 * @param {{lat: number, lon: number}} from - Punto di partenza
 * @param {{lat: number, lon: number}} to - Punto di arrivo
 * @param {string} mode - Modalità di viaggio ('driving' o 'walking')
 * @returns {Promise<Array<{lat: number, lon: number}>>} - Lista di coordinate
 */
async function getRouteSegment(from, to, mode = 'driving') {
  const key = `${from.lat},${from.lon}_${to.lat},${to.lon}_${mode}`;
  if (routeCache.has(key)) return routeCache.get(key);

  const url = `https://router.project-osrm.org/route/v1/${mode}/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson`;
  try {
    const res = await axios.get(url);
    const coords = res.data.routes[0].geometry.coordinates;
    const result = coords.map(([lon, lat]) => ({ lat, lon }));
    routeCache.set(key, result);
    return result;
  } catch (err) {
    console.error(`Errore OSRM routing (${mode}):`, err.message);
    return [from, to];
  }
}

module.exports = { getRouteSegment };