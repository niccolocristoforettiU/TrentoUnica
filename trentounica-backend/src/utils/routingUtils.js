const axios = require('axios');
const { isInZTL } = require('./ztlUtils');
const { findNearestParking } = require('./parkingUtils');
const { getRouteSegment } = require('./osrmUtils');

async function getSplitRoute(from, parking, to) {
  const drivingRoute = (await getRouteSegment(from, parking, 'driving')).map(p => ({ ...p, mode: 'driving' }));
  const walkingRoute = (await getRouteSegment(parking, to, 'walking')).map(p => ({ ...p, mode: 'walking' }));
  return { drivingRoute, walkingRoute };
}

module.exports = { getSplitRoute, getRouteSegment };
