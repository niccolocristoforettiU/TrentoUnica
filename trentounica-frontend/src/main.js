// src/main.js
import { createApp } from 'vue';
import App from './App.vue';
import router from './router'; // Importa il router
import VueGoogleMaps from '@fawmi/vue-google-maps';

createApp(App)
  .use(router)
  .use(VueGoogleMaps, {
    load: {
      key: process.env.VUE_APP_GOOGLE_MAPS_API_KEY,
      libraries: 'places',   
    },
  })
  .mount('#app');
