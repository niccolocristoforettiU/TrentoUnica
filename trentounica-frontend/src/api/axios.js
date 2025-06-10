// src/api/axios.js
import axios from 'axios';
import router from '@/router';

const API = axios.create({
  baseURL: 'http://process.env.VUE_APP_API_URL/api', // URL del tuo backend Express
  headers: {
    'Content-Type': 'application/json',
  },
});

//  Interceptor per aggiungere il token JWT alle richieste
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

//  Interceptor per gestire errori di autenticazione
API.interceptors.response.use(
  response => response,
  error => {
    const isLoginCall = error.config?.url?.includes('/users/login');

    if (error.response && error.response.status === 401 && !isLoginCall) {
      // Pulizia localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('name');
      localStorage.removeItem('guestId');

      // Reindirizza alla pagina d'errore solo se NON è il login
      router.push({
        name: 'ErrorPage',
        query: { message: 'Sessione scaduta. Effettua di nuovo il login.' }
      });
    }

    return Promise.reject(error);
  }
);


export default API;
