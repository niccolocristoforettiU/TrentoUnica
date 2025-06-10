const request = require('supertest');
const User = require('../models/userModel');
const mongoose = require('mongoose');
const app = require('../app');
require('dotenv').config();


describe('POST /api/users/register - Registrazione ORGANIZER con location', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Elimina se esiste per far risultare il test corretto (funziona anche senza eliminarlo ma il test da errore lo stesso)
    await User.deleteOne({ email: "yoshi.club@gmail.com" });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('dovrebbe registrare un nuovo organizer con una location valida', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        email: "yoshi.club@gmail.com",
        password: "Password123!",
        ripetiPassword: "Password123!",
        role: "organizer",
        companyName: "Yoshi Club",
        partitaIva: 12345678910,
        locations: [
          {
            name: "Yoshi Club",
            address: "Piazza Venezia, Trento",
            openingTime: "18:00",
            closingTime: "03:00",
            maxSeats: 500,
            category: "discoteca",
            lat: 46.0705,
            lon: 11.1190
          }
        ]
      });

    expect([201, 200]).toContain(res.statusCode);
    if (res.statusCode === 201) {
      expect(res.body.message).toBe("Registrazione come organizer in attesa di verifica.");
    } else if (res.statusCode === 200) {
      expect(res.body.message).toBe("Utente già registrato, puoi effettuare il login.");
    }
  });
});
