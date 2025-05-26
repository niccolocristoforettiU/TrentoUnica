const axios = require('axios');
const { isInZTL } = require('./ztlUtils');
const { findNearestParking } = require('./parkingUtils');
const { getNearbyPOIFlows: getPostEventWalkRoutes } = require('./poiUtils');
const { getRouteSegment } = require('./osrmUtils');

async function getStreetRoute(from, to) {
  if (!isInZTL(to.lat, to.lon)) {
    return await getRouteSegment(from, to, 'driving');
  }
  const parkingPoint = findNearestParking(to);
  if (!parkingPoint) return [from, to]; // fallback se non ci sono parcheggi validi
  const drivingRoute = await getRouteSegment(from, parkingPoint, 'driving');
  const walkingRoute = await getRouteSegment(parkingPoint, to, 'walking');
  return [...drivingRoute, ...walkingRoute];
}

module.exports = { getStreetRoute, getRouteSegment, getPostEventWalkRoutes };
