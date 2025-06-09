const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
require('dotenv').config();

describe('CREAZIONE EVENTO - Organizer', () => {
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

  it('dovrebbe creare un nuovo evento valido', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: "Yoshi Party Night",
        description: "Una serata unica con DJ set, cocktail e animazione!",
        date: new Date(Date.now() + 86400000).toISOString(), // domani
        locationId,
        category: "discoteca",
        price: 0,
        duration: 500,
        bookingRequired: true,
        ageRestricted: false
      });

    console.log("Status:", res.statusCode);
    console.log("Evento:", res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe("Yoshi Party Night");
  });
});
