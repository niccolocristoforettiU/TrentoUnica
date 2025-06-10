const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Event = require('../models/eventModel');

require('dotenv').config();

describe('DETTAGLIO EVENTO - Endpoint /api/events/:id', () => {
  let eventId = null;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Recupera un evento esistente dal DB
    const futureEvent = await Event.findOne({ date: { $gte: new Date() } });

    expect(futureEvent).toBeTruthy();
    eventId = futureEvent._id;
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('dovrebbe restituire i dettagli completi di un evento', async () => {
    const res = await request(app)
      .get(`/api/events/${eventId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id');
    expect(res.body).toHaveProperty('title');
    expect(res.body).toHaveProperty('description');
    expect(res.body).toHaveProperty('date');
    expect(res.body).toHaveProperty('location');
    expect(res.body).toHaveProperty('organizer');
    expect(res.body).toHaveProperty('bookingCount');

    console.log("🎉 Titolo:", res.body.title);
    console.log("📅 Data:", res.body.date);
    console.log("📍 Location:", res.body.location?.name, "-", res.body.location?.address);
    console.log("🏢 Organizzatore:", res.body.organizer?.companyName, "-", res.body.organizer?.email);
    console.log("🧾 Prenotazioni:", res.body.bookingCount);
  });
});
