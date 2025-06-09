// src/app.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { authenticate } = require('./middlewares/authMiddleware');

if (!process.env.JWT_SECRET || !process.env.MONGODB_URI) {
  console.error("ERRORE: Il file .env non è configurato correttamente. Verifica JWT_SECRET e MONGODB_URI.");
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Connesso al database MongoDB"))
  .catch((err) => {
    console.error("Errore di connessione a MongoDB:", err);
    process.exit(1);
  });

const app = express();

app.use(cors({
  origin: 'http://localhost:8080',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-guest-id']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/preferences', require('./routes/eventPreferenceRoutes'));
app.use("/api/calendar", require("./routes/calendarRoutes"));
app.use('/api/search', require('./routes/eventSearchRoutes'));
app.use('/api/locations', require('./routes/locationRoutes'));
app.use('/api/admin/stats', require('./routes/adminStatsRoutes'));
app.use('/api/tratte', require('./routes/tratteRoutes'));
app.use('/api/organizer/stats', require('./routes/organizerStatsRoutes'));
app.use('/api/trattabookings', require('./routes/tratteBookingRoutes'));

app.get('/api/protected', authenticate, (req, res) => {
  res.json({ message: `Ciao ${req.user.email}, sei autenticato!` });
});

app.get('/', (req, res) => {
  res.send('Server TrentoUnica è attivo');
});

app.use((req, res, next) => {
  res.status(404).json({ message: 'Risorsa non trovata' });
});

app.use((err, req, res, next) => {
  console.error('Errore:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Si è verificato un errore del server',
  });
});

module.exports = app;
