const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Tratta = require('../models/trattaModel');
const User = require('../models/userModel');
const Event = require('../models/eventModel');

require('dotenv').config();

describe('CREAZIONE TRATTA DIRETTA - Utente loggato', () => {
  let token;
  let user;
  let event;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Login utente
    const loginRes = await request(app)
      .post('/api/users/login')
      .send({
        email: "mario.rossi@gmail.com",
        password: "Password123!"
      });

    expect(loginRes.statusCode).toBe(200);
    token = loginRes.body.token;

    // Recupera l'utente dal DB
    user = await User.findOne({ email: "mario.rossi@gmail.com" });
    expect(user).toBeTruthy();

    // Recupera l'evento corretto
    const eventsRes = await request(app).get('/api/events');
    expect(eventsRes.statusCode).toBe(200);

    const found = eventsRes.body.find(e => e.title === "Yoshi Party Night (Modificato)");
    expect(found).toBeTruthy();

    event = await Event.findById(found._id);
    expect(event).toBeTruthy();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('crea una tratta con le info dell’utente e dell’evento', async () => {
    const midpoint = {
      lat: user.lat,
      lon: user.lon
    };

    const estimatedDuration = 30; // in minuti
    const departureTime = new Date(new Date(event.date).getTime() - estimatedDuration * 60000);

    const tratta = await Tratta.create({
      event: event._id,
      users: [user._id],
      midpoint,
      departureTime,
      date: event.date,
      estimatedDuration,
      capacity: parseInt(process.env.BUS_CAPACITY_STANDARD || '50'),
      status: 'pending'
    });

    expect(tratta).toBeDefined();
    console.log("🚌 Tratta creata con ID:", tratta._id);
    console.log("🕒 Partenza:", tratta.departureTime);
    console.log("📍 Midpoint:", tratta.midpoint);
  });
});
