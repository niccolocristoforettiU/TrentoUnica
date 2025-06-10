const mongoose = require('mongoose');
const User = require('../models/userModel');
const Event = require('../models/eventModel');
const Booking = require('../models/bookingModel');
const Tratta = require('../models/trattaModel');
const TrattaBooking = require('../models/trattaBookingModel');
const EventPreference = require('../models/eventPreferenceModel');
const LocationPreference = require('../models/locationPreferenceModel');
const Location = require('../models/locationModel');
const Calendar = require('../models/calendarModel');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  await Promise.all([
    Booking.deleteMany({}),
    Event.deleteMany({}),
    Tratta.deleteMany({}),
    TrattaBooking.deleteMany({}),
    EventPreference.deleteMany({}),
    LocationPreference.deleteMany({}),
    Location.deleteMany({}),
    User.deleteMany({}), // o filtra per evitare di cancellare admin
    Calendar.deleteMany({})
  ]);

  console.log('Database pulito prima dei test');
});

// test dummy per evitare errore Jest
test('Pulizia completata', () => {
  expect(true).toBe(true);
});
