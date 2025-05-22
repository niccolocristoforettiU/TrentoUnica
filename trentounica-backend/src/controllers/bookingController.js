const Booking = require('../models/bookingModel');
const Event = require('../models/eventModel');

const getTicketForEvent = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      user: req.user.userId,
      event: req.params.eventId,
      status: 'confirmed',
      paymentStatus: 'paid'
    }).populate({
      path: 'event',
      populate: { path: 'location', select: 'name address' }
    });

    if (!booking) {
      return res.status(403).json({ message: 'Biglietto non disponibile (prenotazione assente o non pagata).' });
    }

    const { title, date, location } = booking.event;

    res.json({
      ticket: {
        title,
        date,
        location,
        qrCodeData: booking._id.toString()
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore nel recupero del biglietto.' });
  }
};

const getClientBookings = async (req, res) => {
  const bookings = await Booking.find({
    user: req.user.userId,
    status: 'confirmed',
    paymentStatus: 'paid'
  }).populate({
    path: 'event',
    populate: { path: 'location', select: 'name address' }
  });

  res.json(bookings);
};

const createBooking = async (req, res) => {
  const { eventId } = req.body;
  const userId = req.user.userId;

  try {
    // Evita prenotazioni duplicate
    const existing = await Booking.findOne({ user: userId, event: eventId });
    if (existing) {
      return res.status(400).json({ message: 'Hai già prenotato questo evento.' });
    }

    // Crea la prenotazione con pagamento confermato (simulato)
    const booking = new Booking({
      user: userId,
      event: eventId,
      status: 'confirmed',
      paymentStatus: 'paid'
    });

    await booking.save();
    res.status(201).json(booking);
  } catch (error) {
    console.error("Errore nella creazione della prenotazione:", error);
    res.status(500).json({ message: 'Errore nella creazione della prenotazione' });
  }
};


module.exports = {
  getTicketForEvent,
  getClientBookings,
  createBooking
};
