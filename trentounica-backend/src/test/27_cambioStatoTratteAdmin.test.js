const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
require('dotenv').config();

describe('CAMBIO STATO TRATTA - Admin', () => {
  let token = null;
  let trattaId = null;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Login come admin
    const loginRes = await request(app)
      .post('/api/users/login')
      .send({
        email: 'admin@admin.com',
        password: 'Password123!'
      });

    expect(loginRes.statusCode).toBe(200);
    token = loginRes.body.token;

    // Recupera una tratta con stato transportApproved
    const tratteRes = await request(app)
      .get('/api/tratte/status/transportApproved/filter')
      .set('Authorization', `Bearer ${token}`);

    expect(tratteRes.statusCode).toBe(200);
    expect(Array.isArray(tratteRes.body)).toBe(true);

    const tratte = tratteRes.body;
    const tratta = tratte[0];

    expect(tratta).toBeDefined();
    trattaId = tratta._id;
    console.log("🛠️ Tratta trovata con stato 'transportApproved':", trattaId);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("dovrebbe aggiornare lo stato della tratta a 'adminApproved'", async () => {
    const res = await request(app)
      .put(`/api/tratte/${trattaId}/status/admin`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'adminApproved' });

    expect(res.statusCode).toBe(200);
    expect(res.body.tratta.status).toBe('adminApproved');
    console.log("✅ Stato tratta aggiornato a:", res.body.tratta.status);
  });
});
