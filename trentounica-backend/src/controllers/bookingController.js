const Booking = require('../models/bookingModel');
const Event = require('../models/eventModel');
const EventPreference = require('../models/eventPreferenceModel');

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
      return res.status(200).json({ hasBooking: false });
    }

    const { title, date, location } = booking.event;

    res.status(200).json({
      hasBooking: true,
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
      if (existing.status === 'confirmed') {
        return res.status(400).json({ message: 'Hai già prenotato questo evento.' });
      } else if (existing.status === 'cancelled') {
        // Riattiva la prenotazione
        existing.status = 'confirmed';
        existing.paymentStatus = 'paid';
        await existing.save();
        return res.status(200).json(existing);
      }
    }

    // Crea la prenotazione con pagamento confermato (simulato)
    const booking = new Booking({
      user: userId,
      event: eventId,
      status: 'confirmed',
      paymentStatus: 'paid'
    });

    await booking.save();

    const pref = await EventPreference.findOneAndDelete({ user: userId, event: eventId });
    if (!pref) {
      await Event.findByIdAndUpdate(eventId, { $inc: { popularity: 1 } });
    }

    res.status(201).json(booking);
  } catch (error) {
    console.error("Errore nella creazione della prenotazione:", error);
    res.status(500).json({ message: 'Errore nella creazione della prenotazione' });
  }
};

// Annulla prenotazione (solo se gratuita e confermata)
const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.userId;

    const booking = await Booking.findOne({ _id: bookingId, user: userId });

    if (!booking) {
      return res.status(404).json({ message: 'Prenotazione non trovata' });
    }

    const event = await Event.findById(booking.event);
    if (!event) {
      return res.status(404).json({ message: 'Evento non trovato' });
    }

    if (event.price > 0) {
      return res.status(403).json({ message: 'Solo gli eventi gratuiti possono essere annullati automaticamente.' });
    }

    booking.status = 'cancelled';
    await booking.save();

    await EventPreference.deleteOne({ user: userId, event: booking.event }); // Assicura che venga rimossa ogni automatica

    const existingPref = await EventPreference.findOne({ user: userId, event: booking.event });
    if (!existingPref) {
      await Event.findByIdAndUpdate(booking.event, { $inc: { popularity: -1 } });
    }

    res.json({ message: 'Prenotazione annullata con successo.' });
  } catch (error) {
    console.error('Errore durante l\'annullamento della prenotazione:', error);
    res.status(500).json({ message: 'Errore durante l\'annullamento della prenotazione' });
  }
};


module.exports = {
  getTicketForEvent,
  getClientBookings,
  createBooking,
  cancelBooking
};
