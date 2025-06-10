const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
require('dotenv').config();

describe('STATISTICHE ORGANIZZATORE - Dashboard Organizer', () => {
  let token = null;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Login organizer
    const loginRes = await request(app)
      .post('/api/users/login')
      .send({
        email: 'yoshi.club@gmail.com',
        password: 'Password123!'
      });

    expect(loginRes.statusCode).toBe(200);
    token = loginRes.body.token;
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('recupera le statistiche di preferenze, prenotazioni e ricavi', async () => {
    // Preferenze
    const prefRes = await request(app)
      .get('/api/organizer/stats/preferences')
      .set('Authorization', `Bearer ${token}`);

    expect(prefRes.statusCode).toBe(200);
    console.log('📊 Preferenze eventi:');
    prefRes.body.slice(0, 3).forEach(event => {
      console.log(`• ${event.title} (${event.location}) → Età:`, event.ageGroups);
    });

    // Prenotazioni
    const bookingRes = await request(app)
      .get('/api/organizer/stats/bookings')
      .set('Authorization', `Bearer ${token}`);

    expect(bookingRes.statusCode).toBe(200);
    console.log('\n🪪 Prenotazioni eventi:');
    bookingRes.body.slice(0, 3).forEach(event => {
      console.log(`• ${event.title} (${event.totalBookings} booking) → Età:`, event.ageGroups);
    });

    // Ricavi
    const revenueRes = await request(app)
      .get('/api/organizer/stats/revenues')
      .set('Authorization', `Bearer ${token}`);

    expect(revenueRes.statusCode).toBe(200);
    console.log('\n💰 Ricavi eventi:');
    revenueRes.body.slice(0, 3).forEach(event => {
      console.log(`• ${event.title} → € ${event.revenue}`);
    });
  });
});
