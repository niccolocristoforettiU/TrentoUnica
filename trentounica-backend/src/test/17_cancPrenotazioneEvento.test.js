const request = require('supertest');
const app = require('../app');

describe('ANNULLAMENTO PRENOTAZIONE EVENTO GRATUITO (via API)', () => {
  let token;
  let eventId;
  let bookingId;

  beforeAll(async () => {
    // Login utente
    const loginRes = await request(app)
      .post('/api/users/login')
      .send({
        email: 'mario.rossi@gmail.com',
        password: 'Password123!'
      });

    expect(loginRes.statusCode).toBe(200);
    token = loginRes.body.token;

    // Ottieni eventi
    const eventListRes = await request(app).get('/api/events');
    expect(eventListRes.statusCode).toBe(200);
    const events = eventListRes.body;

    // Prendi un evento gratuito con prenotazione richiesta
    const bookableEvent = events.find(e =>
      Boolean(e.bookingRequired) === true &&
      Number(e.price) === 0
    );

    console.log("🎯 Evento selezionato:", bookableEvent);

    expect(bookableEvent).toBeTruthy();
    eventId = bookableEvent._id;

    // Ottieni ticket per trovare bookingId
    const ticketRes = await request(app)
      .get(`/api/bookings/ticket/${eventId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(ticketRes.statusCode).toBe(200);
    expect(ticketRes.body.hasBooking).toBe(true);
    bookingId = ticketRes.body.ticket.qrCodeData;
  });

  it('dovrebbe permettere di annullare la prenotazione per evento gratuito', async () => {
    const cancelRes = await request(app)
      .delete(`/api/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(cancelRes.statusCode).toBe(200);
    expect(cancelRes.body.message).toMatch(/annullata/i);
    console.log('🗑️ Prenotazione annullata con successo:', bookingId);
  });
});
