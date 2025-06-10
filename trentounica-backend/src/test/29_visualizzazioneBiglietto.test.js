const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
require('dotenv').config();

describe('VERIFICA PRENOTAZIONI TRATTA (via API)', () => {
  let token;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Login utente
    const loginRes = await request(app)
      .post('/api/users/login')
      .send({
        email: "mario.rossi@gmail.com",
        password: "Password123!"
      });

    expect(loginRes.statusCode).toBe(200);
    token = loginRes.body.token;
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("dovrebbe mostrare le prenotazioni tratte dell'utente", async () => {
    const res = await request(app)
      .get('/api/trattabookings/client')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    const bookings = res.body;

    if (bookings.length === 0) {
      console.log("❌ Nessuna prenotazione tratta trovata per l'utente.");
    } else {
      console.log(`📦 ${bookings.length} prenotazione/i trovata/e:`);
      bookings.forEach((b, index) => {
        const event = b.tratta.event;
        const locationName = event.location?.name || 'Luogo non specificato';

        console.log(`\n🔹 Prenotazione #${index + 1}`);
        console.log(`  - Evento: ${event.title}`);
        console.log(`  - Data: ${new Date(event.date).toLocaleString()}`);
        console.log(`  - Luogo: ${locationName}`);
        console.log(`  - Tratta ID: ${b.tratta._id}`);
        console.log(`  - Booking ID: ${b._id}`);
        console.log(`  - QR Code: ${b.qrCodeData}`);
      });
    }

    expect(Array.isArray(bookings)).toBe(true);
  });
});
