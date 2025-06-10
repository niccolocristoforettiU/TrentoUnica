const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../app');
require('dotenv').config();

describe('CREAZIONE EVENTO +18 - Organizer', () => {
  let organizerToken = null;
  let locationId = null;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Login organizer verificato
    const loginRes = await request(app)
      .post('/api/users/login')
      .send({
        email: 'yoshi.club@gmail.com',
        password: 'Password123!'
      });

    expect(loginRes.statusCode).toBe(200);
    organizerToken = loginRes.body.token;

    // Ottieni location attiva dell'organizer
    const locationRes = await request(app)
      .get('/api/locations/organizer')
      .set('Authorization', `Bearer ${organizerToken}`);

    expect(locationRes.statusCode).toBe(200);
    const locations = locationRes.body;
    const validLoc = locations.find(loc => loc.enabled === true);
    expect(validLoc).toBeDefined();
    locationId = validLoc._id;
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('dovrebbe creare un evento +18 valido', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: "Yoshi Party Night 18+",
        description: "Solo per adulti, DJ set fino all'alba!",
        date: new Date(Date.now() + 86400000 * 2).toISOString(), // tra 2 giorni
        locationId,
        category: "discoteca",
        price: 0,
        duration: 480,
        bookingRequired: true,
        ageRestricted: true,
        minAge: 18
      });

    console.log("Status:", res.statusCode);
    console.log("Evento creato:", res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe("Yoshi Party Night 18+");
    expect(res.body.ageRestricted).toBe(true);
    expect(res.body.minAge).toBe(18);
  });
});
