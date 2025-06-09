const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
require('dotenv').config();

describe('VERIFICA ORGANIZER - Admin', () => {
  let adminToken = null;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Effettua login come admin
    const loginRes = await request(app)
      .post('/api/users/login')
      .send({
        email: 'admin@admin.com',
        password: 'Password123!' // assicurati che questo utente admin esista nel DB
      });

    expect(loginRes.statusCode).toBe(200);
    adminToken = loginRes.body.token;
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('dovrebbe verificare un organizer non ancora approvato', async () => {
    // Ottieni tutti gli organizer non verificati
    const pendingRes = await request(app)
      .get('/api/users/organizers/pending')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(pendingRes.statusCode).toBe(200);
    const organizers = pendingRes.body;
    expect(organizers.length).toBeGreaterThan(0);

    const organizer = organizers.find(o => o.email === 'yoshi.club@gmail.com');
    expect(organizer).toBeDefined();

    // Verifica l’organizer
    const verifyRes = await request(app)
      .put(`/api/users/verify/${organizer._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    //console.log("Verifica Status:", verifyRes.statusCode);
    //console.log("Messaggio:", verifyRes.body.message);

    expect(verifyRes.statusCode).toBe(200);
    expect(verifyRes.body.message).toContain('verificato con successo');
    expect(verifyRes.body.user.verified).toBe(true);
  });
});
