const request = require('supertest');
const app = require('../app');

describe('ESPRESSIONE PREFERENZA LOCATION ESISTENTE (via API)', () => {
  let token;
  let userId;
  let locationId;

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

    // Ottieni tutte le location pubbliche (dove ci sono eventi)
    const eventListRes = await request(app).get('/api/events');
    expect(eventListRes.statusCode).toBe(200);

    const events = eventListRes.body;
    expect(events.length).toBeGreaterThan(0);

    // Trova una location valida da un evento futuro
    const futureEvent = events.find(e => new Date(e.date) >= new Date() && e.location);
    expect(futureEvent).toBeTruthy();
    locationId = futureEvent.location._id;

    // Rimuovi eventuali preferenze precedenti su quella location
    await request(app)
      .delete(`/api/locations/${locationId}/preference`)
      .set('Authorization', `Bearer ${token}`);
  });

  it('dovrebbe permettere di esprimere una preferenza per una location esistente', async () => {
    const res = await request(app)
      .post(`/api/locations/${locationId}/preference`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Location aggiunta alle preferenze.');
    console.log('✅ Preferenza espressa per location:', locationId);
  });
});
