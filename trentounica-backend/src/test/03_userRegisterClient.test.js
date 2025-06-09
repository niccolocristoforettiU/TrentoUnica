const request = require('supertest');
const User = require('../models/userModel');
const mongoose = require('mongoose');
const app = require('../app');
require('dotenv').config();

describe('POST /api/register - Registrazione CLIENT', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Elimina se esiste per far risultare il test corretto (funziona anche senza eliminarlo ma il test da errore lo stesso)
    await User.deleteOne({ email: "mario.rossi@gmail.com" });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('dovrebbe registrare un nuovo utente client o gestire duplicato', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        name: "Mario Rossi",
        email: "mario.rossi@gmail.com",
        password: "Password123!",
        ripetiPassword: "Password123!",
        role: "client",
        address: "Via della Canova 60 Trento",
        birthDate: "2000-05-31T00:00:00.000+00:00",
        lat: 46.0705,
        lon: 11.1190
      });



    expect([201, 200]).toContain(res.statusCode);
    if (res.statusCode === 201) {
      expect(res.body.message).toBe("Registrazione avvenuta con successo.");
    } else if (res.statusCode === 200) {
      expect(res.body.message).toBe("Utente già registrato, puoi effettuare il login.");
    }
  });
});
