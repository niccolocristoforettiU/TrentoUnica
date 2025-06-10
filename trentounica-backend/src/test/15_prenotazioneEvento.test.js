const request = require('supertest');
const app = require('../app');

describe('PRENOTAZIONE EVENTO GRATUITO (via API)', () => {
  let token;
  let eventId;

  beforeAll(async () => {
    // Login utente
    const loginRes = await request(app)
      .post('/api/users/login')
      .send({
        email: "mario.rossi@gmail.com",
        password: "Password123!"
      });

    expect(loginRes.statusCode).toBe(200);
    token = loginRes.body.token;

    // Ottieni tutti gli eventi
    const eventListRes = await request(app).get('/api/events');
    expect(eventListRes.statusCode).toBe(200);

    const events = eventListRes.body;
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);

    // Prendi un evento gratuito con prenotazione richiesta
    const bookableEvent = events.find(e => e.bookingRequired && e.price === 0);
    expect(bookableEvent).toBeTruthy();

    eventId = bookableEvent._id;
  });

  it('dovrebbe permettere di prenotare un evento gratuito che richiede prenotazione', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ eventId });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('booking');
    expect(res.body.booking.event).toBe(eventId);

    console.log('✅ Prenotazione confermata per evento:', eventId);
  });
});
