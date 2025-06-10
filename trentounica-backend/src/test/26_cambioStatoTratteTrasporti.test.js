const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
require('dotenv').config();

describe('CAMBIO STATO TRATTA - Trasporti', () => {
  let token = null;
  let trattaId = null;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Login utente trasporti
    const loginRes = await request(app)
      .post('/api/users/login')
      .send({
        email: 'trasporti@trasporti.com',
        password: 'Password123!'
      });

    expect(loginRes.statusCode).toBe(200);
    token = loginRes.body.token;

    // Recupera una tratta con stato pending
    const tratteRes = await request(app)
      .get('/api/tratte/status/pending/filter')
      .set('Authorization', `Bearer ${token}`);

    expect(tratteRes.statusCode).toBe(200);
    expect(Array.isArray(tratteRes.body)).toBe(true);

    const tratte = tratteRes.body;
    const tratta = tratte[0];

    expect(tratta).toBeDefined();
    trattaId = tratta._id;
    console.log("🚍 Tratta trovata con stato 'pending':", trattaId);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("dovrebbe aggiornare lo stato della tratta a 'transportApproved'", async () => {
    const res = await request(app)
      .put(`/api/tratte/${trattaId}/status/transport`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'transportApproved' });

    expect(res.statusCode).toBe(200);
    expect(res.body.tratta.status).toBe('transportApproved');
    console.log("✅ Stato tratta aggiornato a:", res.body.tratta.status);
  });
});
