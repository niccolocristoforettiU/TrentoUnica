const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
require('dotenv').config();

describe('FORGOT PASSWORD - /api/users/forgot-password', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('dovrebbe inviare un\'email di reset password a un utente registrato', async () => {
    const res = await request(app)
      .post('/api/users/forgot-password')
      .send({ email: 'luismartin.bugnotti@gmail.com' }); // sostituisci con una mail reale se necessario

    expect([200, 404]).toContain(res.statusCode);

    if (res.statusCode === 200) {
      expect(res.body.message).toMatch(/email/i);
      console.log("📧 Email di reset inviata correttamente.");
    } else if (res.statusCode === 404) {
      console.log("⚠️ Nessun utente trovato con questa email.");
    }
  });

  it('dovrebbe restituire errore se manca l\'email nel body', async () => {
    const res = await request(app)
      .post('/api/users/forgot-password')
      .send({}); // niente email

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/email mancante/i);
  });
});
