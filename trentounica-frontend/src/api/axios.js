// src/api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // URL del tuo backend Express
  headers: {
    'Content-Type': 'application/json',
  },
});

// Aggiungi un interceptor per aggiungere il token di autenticazione (JWT) alle richieste
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;