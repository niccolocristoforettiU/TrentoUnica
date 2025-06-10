const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/userModel');
const Location = require('../models/locationModel');
const LocationPreference = require('../models/locationPreferenceModel');
const Event = require('../models/eventModel');

require('dotenv').config();

describe('RICERCA EVENTI - Endpoint /api/search', () => {
  let clientToken = null;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Login utente client
    const loginRes = await request(app)
      .post('/api/users/login')
      .send({
        email: "mario.rossi@gmail.com",
        password: "Password123!"
      });

    expect(loginRes.statusCode).toBe(200);
    clientToken = loginRes.body.token;
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('dovrebbe restituire solo eventi futuri con query e categoria', async () => {
    const res = await request(app)
      .get('/api/search')
      .set('Authorization', `Bearer ${clientToken}`)
      .query({
        query: "party",
        category: "discoteca",
        onlyUpcoming: true,
        sortByDate: true
      });

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    console.log("📦 Eventi restituiti dalla ricerca:");
    res.body.forEach(event => {
      console.log(`🎉 Titolo: ${event.title}`);
      console.log(`📅 Data: ${event.date}`);
      console.log(`🏷️ Categoria: ${event.category}`);
      console.log(`📍 Location: ${event.location?.name || 'N/A'} - ${event.location?.address || 'N/A'}`);
      console.log('---');
    });

    for (const event of res.body) {
      const eventDate = new Date(event.date);
      expect(event.title.toLowerCase()).toContain("party");
      expect(event.category).toBe("discoteca");
      expect(eventDate >= new Date(new Date().setHours(0, 0, 0, 0))).toBe(true);
    }
  });

  it('dovrebbe bloccare i filtri riservati se non autenticato', async () => {
    const res = await request(app)
      .get('/api/search')
      .query({
        onlyMine: true,
        onlyPreferred: true
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('Filtri riservati agli utenti registrati');
  });
});
