const Booking = require('../models/bookingModel');
const Event = require('../models/eventModel');
const EventPreference = require('../models/eventPreferenceModel');
const User = require('../models/userModel');

// Utility per calcolare l'età da una data di nascita
const calculateAge = (birthDate) => {
  const ageDifMs = Date.now() - birthDate.getTime();
  const ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

const groupByAge = (users) => {
  const groups = {
    '0-17': 0,
    '18-25': 0,
    '26-35': 0,
    '36-50': 0,
    '51+': 0,
    'undefined': 0
  };
  users.forEach(u => {
    if (!u || !u.birthDate) {
      groups['undefined']++;
      return;
    }
    const age = calculateAge(u.birthDate);
    if (age < 18) groups['0-17']++;
    else if (age <= 25) groups['18-25']++;
    else if (age <= 35) groups['26-35']++;
    else if (age <= 50) groups['36-50']++;
    else groups['51+']++;
  });
  return groups;
};

exports.getPreferencesHistogram = async (req, res) => {
  try {
    const organizerId = req.user.userId;
    const { startDate, endDate, category, organizerOnly } = req.query;

    const eventQuery = {};
    if (startDate) eventQuery.date = { ...(eventQuery.date || {}), $gte: new Date(startDate) };
    if (endDate) eventQuery.date = { ...(eventQuery.date || {}), $lte: new Date(endDate) };
    if (category) eventQuery.category = category;
    if (organizerOnly === 'true') eventQuery.organizer = organizerId;

    const events = await Event.find(eventQuery).populate('location', 'name').lean();
    const eventIds = events.map(e => e._id);

    const preferences = await EventPreference.find({ event: { $in: eventIds } }).populate('user', 'birthDate');

    const grouped = {};
    preferences.forEach(pref => {
      const eventId = pref.event.toString();
      if (!grouped[eventId]) grouped[eventId] = [];
      grouped[eventId].push(pref.user);
    });

    const result = events.map(event => {
      const users = grouped[event._id.toString()] || [];
      const startDate = event.date instanceof Date ? event.date.toISOString() : event.date;
      const endDateObj = new Date(event.date.getTime() + event.duration * 60000);
      const endDate = endDateObj.toISOString();
      return {
        eventId: event._id,
        title: event.title,
        startDate,
        endDate,
        location: event.location.name,
        ageGroups: groupByAge(users)
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Errore nel recupero preferenze:', error);
    res.status(500).json({ message: 'Errore nel recupero preferenze eventi.' });
  }
};

exports.getBookingsHistogram = async (req, res) => {
  try {
    const organizerId = req.user.userId;
    const { startDate, endDate, category, organizerOnly } = req.query;

    const eventQuery = { bookingRequired: true };
    if (startDate) eventQuery.date = { ...(eventQuery.date || {}), $gte: new Date(startDate) };
    if (endDate) eventQuery.date = { ...(eventQuery.date || {}), $lte: new Date(endDate) };
    if (category) eventQuery.category = category;
    if (organizerOnly === 'true') eventQuery.organizer = organizerId;

    const events = await Event.find(eventQuery).populate('location', 'name').lean();
    const eventIds = events.map(e => e._id);

    const bookings = await Booking.find({
      event: { $in: eventIds },
      status: 'confirmed',
      paymentStatus: 'paid'
    }).populate('user', 'birthDate');

    const grouped = {};
    bookings.forEach(booking => {
      const eventId = booking.event.toString();
      if (!grouped[eventId]) grouped[eventId] = [];
      grouped[eventId].push(booking.user);
    });

    const result = events.map(event => {
      const users = grouped[event._id.toString()] || [];
      const startDate = event.date instanceof Date ? event.date.toISOString() : event.date;
      const endDateObj = new Date(event.date.getTime() + event.duration * 60000);
      const endDate = endDateObj.toISOString();
      return {
        eventId: event._id,
        title: event.title,
        startDate,
        endDate,
        location: event.location.name,
        totalBookings: users.length,
        ageGroups: groupByAge(users)
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Errore nel recupero prenotazioni:', error);
    res.status(500).json({ message: 'Errore nel recupero prenotazioni eventi.' });
  }
};

exports.getRevenueHistogram = async (req, res) => {
  try {
    const organizerId = req.user.userId;

    const events = await Event.find({
      organizer: organizerId,
      price: { $gt: 0 },
      date: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) }
    }).populate('location', 'name').lean();

    const eventIds = events.map(e => e._id);

    const bookings = await Booking.find({
      event: { $in: eventIds },
      status: 'confirmed',
      paymentStatus: 'paid'
    }).populate({
      path: 'event',
      select: 'price'
    });

    const revenueByEvent = {};
    bookings.forEach(booking => {
      const eventId = booking.event._id.toString();
      if (!revenueByEvent[eventId]) revenueByEvent[eventId] = 0;
      revenueByEvent[eventId] += booking.event.price;
    });

    const result = events.map(event => ({
      eventId: event._id,
      title: event.title,
      date: event.date,
      location: event.location.name,
      revenue: revenueByEvent[event._id.toString()] || 0
    }));

    res.json(result);
  } catch (error) {
    console.error('Errore nel calcolo ricavi:', error);
    res.status(500).json({ message: 'Errore nel calcolo ricavi eventi.' });
  }
};
