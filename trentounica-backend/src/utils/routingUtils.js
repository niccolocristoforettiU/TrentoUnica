const axios = require('axios');

async function getStreetRoute(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson`;

  try {
    const res = await axios.get(url);
    const coords = res.data.routes[0].geometry.coordinates;
    return coords.map(([lon, lat]) => ({ lat, lon }));
  } catch (err) {
    console.error('Errore OSRM routing:', err.message);
    return [from, to]; // fallback diretto
  }
}

module.exports = { getStreetRoute };
