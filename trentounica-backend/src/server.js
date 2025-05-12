// src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('./config/database');
const { authenticate } = require('./middlewares/authMiddleware');

const app = express();

// Configurazione CORS
app.use(cors({
  origin: 'http://localhost:8080',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware per il parsing del corpo delle richieste
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Importare le rotte
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));

// Rotta protetta per testare JWT
app.get('/api/protected', authenticate, (req, res) => {
  res.json({ message: `Ciao ${req.user.email}, sei autenticato!` });
});

// Rotta di test per verificare che il server sia attivo
app.get('/', (req, res) => {
  res.send('Server TrentoUnica è attivo');
});

// Middleware per le rotte non trovate (404)
app.use((req, res, next) => {
  res.status(404).json({ message: 'Risorsa non trovata' });
});

// Middleware per la gestione degli errori globali
app.use((err, req, res, next) => {
  console.error('Errore:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Si è verificato un errore del server',
  });
});

// Avviare il server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});