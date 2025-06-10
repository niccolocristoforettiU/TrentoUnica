const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
require('dotenv').config();

describe('MODIFICA EVENTO ESISTENTE - Organizer', () => {
  let organizerToken = null;
  let eventId = null;
  let fullEvent = null;
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

    // Ottieni tutti gli eventi
    const eventListRes = await request(app).get('/api/events');
    expect(eventListRes.statusCode).toBe(200);
    const events = eventListRes.body;

    // Trova il primo evento futuro
    const futureEvent = events.find(e => new Date(e.date) >= new Date());
    expect(futureEvent).toBeTruthy();
    eventId = futureEvent._id;
    fullEvent = futureEvent;

    console.log("✏️ Evento da modificare:", eventId);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('dovrebbe aggiornare il titolo dell\'evento in "Modificato"', async () => {
    const updateRes = await request(app)
      .put(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: "Yoshi Party Night (Modificato)",
        description: fullEvent.description,
        date: fullEvent.date,
        locationId: locationId,
        category: fullEvent.category,
        price: fullEvent.price,
        duration: fullEvent.duration,
        bookingRequired: fullEvent.bookingRequired,
        ageRestricted: fullEvent.ageRestricted,
        minAge: fullEvent.ageRestricted ? (fullEvent.minAge || 18) : undefined
      });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.title).toBe("Yoshi Party Night (Modificato)");
    console.log("✅ Evento aggiornato con nuovo titolo:", updateRes.body.title);
  });
});
