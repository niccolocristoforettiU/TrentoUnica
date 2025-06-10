const request = require('supertest');
const app = require('../app');

describe('VISUALIZZAZIONE BIGLIETTO (via API)', () => {
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

    // Ottieni eventi
    const eventListRes = await request(app)
      .get('/api/events');

    expect(eventListRes.statusCode).toBe(200);
    const events = eventListRes.body;
    expect(events.length).toBeGreaterThan(0);

    // Trova evento futuro con prenotazione richiesta e gratuito
    const futureEvent = events.find(e =>
      new Date(e.date) >= new Date() &&
      e.bookingRequired === true &&
      e.price === 0
    );

    expect(futureEvent).toBeTruthy();
    eventId = futureEvent._id;

    // Effettua la prenotazione (se non già fatta)
    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ eventId });
  });

  it('dovrebbe restituire il biglietto per l\'evento prenotato', async () => {
    const res = await request(app)
      .get(`/api/bookings/ticket/${eventId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.hasBooking).toBe(true);
    expect(res.body.ticket).toHaveProperty('title');
    expect(res.body.ticket).toHaveProperty('date');
    expect(res.body.ticket).toHaveProperty('location');
    expect(res.body.ticket).toHaveProperty('qrCodeData');

    console.log('🎫 Biglietto ottenuto per evento:', eventId);
  });
});
