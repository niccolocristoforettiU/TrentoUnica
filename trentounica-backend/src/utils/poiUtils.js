

const fs = require('fs');
const path = require('path');
const turf = require('@turf/turf');
const { getRouteSegment } = require('./osrmUtils');

// Load POI GeoJSON data
const poiPath = path.join(__dirname, '../data/post_event_pois.geojson');
const poiData = JSON.parse(fs.readFileSync(poiPath));

// Assign a weight to each amenity type
function getWeightByAmenity(amenity) {
  switch (amenity) {
    case 'bar':
    case 'pub':
    case 'nightclub':
      return 0.6;
    case 'cafe':
    case 'fast_food':
      return 0.4;
    case 'park':
    case 'pedestrian':
      return 0.3;
    default:
      return 0.2;
  }
}

/**
 * Returns simulated post-event pedestrian flows towards nearby POIs.
 * @param {{lat: number, lon: number}} to - The event location.
 * @param {number} [maxDistance=0.6] - Max distance in kilometers to search for POIs.
 * @returns {Promise<Array<{route: any, weight: number}>>}
 */
async function getNearbyPOIFlows(to, maxDistance = 0.6) {
  const origin = turf.point([to.lon, to.lat]);
  const flows = [];

  for (const feature of poiData.features) {
    if (feature.geometry.type !== 'Point') continue;

    const coords = feature.geometry.coordinates;
    const amenity = feature.properties?.amenity || feature.properties?.leisure || feature.properties?.highway;
    if (!amenity) continue;

    const point = turf.point(coords);
    const distance = turf.distance(origin, point, { units: 'kilometers' });
    if (distance > maxDistance) continue;

    const target = { lat: coords[1], lon: coords[0] };
    const route = await getRouteSegment(to, target, 'walking');
    const weight = getWeightByAmenity(amenity);

    flows.push({ route, weight });
  }

  return flows;
}

module.exports = { getNearbyPOIFlows };