const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../app');
require('dotenv').config();

describe('MODIFICA LOCATION - Organizer', () => {
  let organizerToken = null;
  let locationId = null;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Login come organizer
    const loginRes = await request(app)
      .post('/api/users/login')
      .send({
        email: 'yoshi.club@gmail.com',
        password: 'Password123!'
      });

    expect(loginRes.statusCode).toBe(200);
    organizerToken = loginRes.body.token;

    // Ottieni location dell'organizer
    const locationRes = await request(app)
      .get('/api/locations/organizer')
      .set('Authorization', `Bearer ${organizerToken}`);

    expect(locationRes.statusCode).toBe(200);
    const locations = locationRes.body;
    expect(locations.length).toBeGreaterThan(0);

    locationId = locations[0]._id;
    console.log("📍 Location selezionata per modifica:", locationId);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('dovrebbe aggiornare nome e orari della location', async () => {
    const res = await request(app)
      .put(`/api/locations/${locationId}`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        name: 'Yoshi Club (Modificato)',
        openingTime: '19:00',
        closingTime: '04:00',
        maxSeats: 150
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toMatch(/Modificato/);
    expect(res.body.openingTime).toBe('19:00');
    expect(res.body.closingTime).toBe('04:00');
    expect(res.body.maxSeats).toBe(150);

    console.log("✅ Location modificata con successo:", res.body.name);
  });
});
