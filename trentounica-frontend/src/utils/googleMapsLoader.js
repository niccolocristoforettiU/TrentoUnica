import { Loader } from '@googlemaps/js-api-loader';

const loader = new Loader({
  apiKey: process.env.VUE_APP_GOOGLE_MAPS_API_KEY,
  version: 'weekly',
  libraries: ['places'],
});

export default loader;