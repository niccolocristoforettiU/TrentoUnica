const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
require('dotenv').config();

describe('EVENTI PER MAPPA - /api/events/filter', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('dovrebbe restituire almeno un evento con location valida', async () => {
    const res = await request(app).get('/api/events/filter');
    expect(res.statusCode).toBe(200);

    const eventi = Array.isArray(res.body) ? res.body : [];
    const evento = eventi.find(e => e.location?.lat && e.location?.lon);

    expect(evento).toBeDefined();
    expect(evento).toHaveProperty('title');
    expect(evento).toHaveProperty('date');
    expect(evento.location).toHaveProperty('lat');
    expect(evento.location).toHaveProperty('lon');
  });
});
