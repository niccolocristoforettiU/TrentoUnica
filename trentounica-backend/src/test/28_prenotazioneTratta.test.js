const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
require('dotenv').config();

describe('PRENOTAZIONE TRATTA ATTIVA (via API)', () => {
  let token;
  let eventId;
  let trattaId;

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

    // Recupera un evento gratuito prenotabile
    const eventsRes = await request(app).get('/api/events');
    expect(eventsRes.statusCode).toBe(200);

    const events = eventsRes.body;
    const bookableEvent = events.find(e => e.bookingRequired && e.price === 0);
    expect(bookableEvent).toBeTruthy();

    eventId = bookableEvent._id;

    // Prenota l’evento se non già prenotato
    const eventBookingRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ eventId });

    expect([200, 400]).toContain(eventBookingRes.statusCode); // già prenotato o nuovo

    // Ottieni tratte legate all'evento
    const tratteRes = await request(app)
      .get(`/api/tratte/event/${eventId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(tratteRes.statusCode).toBe(200);
    const tratte = tratteRes.body;

    const prenotabile = tratte.find(t => t.status === 'adminApproved' && t.active === true);
    expect(prenotabile).toBeDefined();

    trattaId = prenotabile._id;
    console.log("🚌 Tratta attiva trovata:", trattaId);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("dovrebbe permettere la prenotazione della tratta", async () => {
    const res = await request(app)
      .post('/api/trattabookings') 
      .set('Authorization', `Bearer ${token}`)
      .send({ trattaId });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/Prenotazione.*confermata/i);
    console.log("✅ Prenotazione tratta confermata.");
  });
});
