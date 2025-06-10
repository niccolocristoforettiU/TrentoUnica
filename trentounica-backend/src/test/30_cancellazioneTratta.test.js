const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
require('dotenv').config();

describe('CANCELLAZIONE PRENOTAZIONE TRATTA (via API)', () => {
  let token;
  let trattaId;
  let bookingId;

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

    // Recupera un evento prenotabile
    const eventsRes = await request(app).get('/api/events');
    expect(eventsRes.statusCode).toBe(200);

    const events = eventsRes.body;
    const bookableEvent = events.find(e => e.bookingRequired && e.price === 0);
    expect(bookableEvent).toBeTruthy();

    const eventId = bookableEvent._id;

    // Ottieni tratte legate all'evento
    const tratteRes = await request(app)
      .get(`/api/tratte/event/${eventId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(tratteRes.statusCode).toBe(200);
    const tratte = tratteRes.body;

    const prenotabile = tratte.find(t => t.status === 'adminApproved' && t.active === true);
    expect(prenotabile).toBeDefined();

    trattaId = prenotabile._id;

    // Prenota la tratta
    const bookTrattaRes = await request(app)
      .post('/api/trattabookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ trattaId });

    expect([200, 400]).toContain(bookTrattaRes.statusCode);

    // Recupera prenotazioni attive per trovare l’ID
    const myBookings = await request(app)
      .get('/api/trattabookings/client')
      .set('Authorization', `Bearer ${token}`);

    expect(myBookings.statusCode).toBe(200);
    const found = myBookings.body.find(b => b.tratta._id === trattaId);
    expect(found).toBeDefined();
    bookingId = found._id;
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("dovrebbe annullare una prenotazione tratta", async () => {
    const cancelRes = await request(app)
      .delete(`/api/trattabookings/${bookingId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(cancelRes.statusCode).toBe(200);
    expect(cancelRes.body.message).toMatch(/annullata/i);
    console.log("🗑️ Prenotazione tratta annullata con successo.");
  });
});
