const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
require('dotenv').config();

describe('ATTIVA LOCATION - Admin', () => {
  let adminToken = null;

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
        password: 'Password123!' // Assicurati che esista
      });

    expect(loginRes.statusCode).toBe(200);
    adminToken = loginRes.body.token;
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('dovrebbe attivare una location disabilitata dell\'organizer', async () => {
    // Ottieni tutte le location
    const allLocationsRes = await request(app)
      .get('/api/locations')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(allLocationsRes.statusCode).toBe(200);
    const locations = allLocationsRes.body;

    // Trova la location da attivare
    const targetLocation = locations.find(
      loc =>
        loc.organizer?.email === 'yoshi.club@gmail.com' &&
        loc.enabled === false
    );

    expect(targetLocation).toBeDefined();

    // Attiva la location
    const activateRes = await request(app)
      .patch(`/api/locations/${targetLocation._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ enabled: true });

    expect(activateRes.statusCode).toBe(200);
    expect(activateRes.body.message).toContain('attivata');
    expect(activateRes.body.location.enabled).toBe(true);
  });
});
