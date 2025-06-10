const request = require('supertest');
const app = require('../app');

describe('ESPRESSIONE PREFERENZA EVENTO ESISTENTE (via API)', () => {
  let token;
  let userId;
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
    userId = loginRes.body.user?._id;

    // Ottieni tutti gli eventi
    const eventListRes = await request(app)
      .get('/api/events');

    expect(eventListRes.statusCode).toBe(200);
    const events = eventListRes.body;
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);

    // Prendi il primo evento futuro (solo lato client)
    const futureEvent = events.find(e => new Date(e.date) >= new Date());
    expect(futureEvent).toBeTruthy();
    eventId = futureEvent._id;

    // Rimuovi eventuali preferenze precedenti
    await request(app)
      .delete(`/api/events/${eventId}/preference`)
      .set('Authorization', `Bearer ${token}`);
  });

  it('dovrebbe permettere di esprimere una preferenza per un evento esistente', async () => {
    const res = await request(app)
      .post(`/api/events/${eventId}/preference`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/preferenza/i);
    console.log('✅ Preferenza espressa per evento:', eventId);
  });
});
