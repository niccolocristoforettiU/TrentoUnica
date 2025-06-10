const Booking = require('../models/bookingModel');
const Event = require('../models/eventModel');
const EventPreference = require('../models/eventPreferenceModel');
const { generateTratte } = require('../utils/tratteUtils');

const getTicketForEvent = async (req, res) => {
  if (!req.user?.userId) {
    return res.status(401).json({ message: 'Autenticazione richiesta per effettuare questa operazione.' });
  }
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
  console.log("entrato")
  if (!req.user?.userId) {
    return res.status(401).json({ message: 'Autenticazione richiesta per effettuare questa operazione.' });
  }
  const bookings = await Booking.find({
    user: req.user.userId,
    status: 'confirmed',
    paymentStatus: 'paid'
  }).populate({
    path: 'event',
    populate: { path: 'location', select: 'name address' }
  });

  // Filter out bookings with missing events
  const validBookings = bookings.filter(booking => booking.event !== null);
  console.log("fine")
  res.json(bookings);
};

const createBooking = async (req, res) => {
  if (!req.user?.userId) {
    return res.status(401).json({ message: 'Autenticazione richiesta per effettuare questa operazione.' });
  }

  const { eventId } = req.body;
  const userId = req.user.userId;

  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Evento non trovato.' });
    }

    const user = await require('../models/userModel').findById(userId);

    // Verifica età minima
    if (event.ageRestricted && event.minAge) {
      const birthDate = new Date(user.birthDate);
      const age = Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
      if (age < event.minAge) {
        return res.status(403).json({ message: `L'età minima per questo evento è ${event.minAge} anni.` });
      }
    }

    // Verifica esistenza prenotazione
    const existing = await Booking.findOne({ user: userId, event: eventId });
    if (existing) {
      if (existing.status === 'confirmed') {
        return res.status(400).json({ message: 'Hai già prenotato questo evento.' });
      } else if (existing.status === 'cancelled') {
        // Riattiva prenotazione cancellata
        existing.status = 'confirmed';
        existing.paymentStatus = 'paid';
        await existing.save();

        // Crea preferenza se non esiste e incrementa popolarità
        const pref = await EventPreference.findOne({ user: userId, event: eventId });
        if (!pref) {
          await EventPreference.create({ user: userId, event: eventId });
          await Event.findByIdAndUpdate(eventId, { $inc: { popularity: 1 } });
        }

        console.log("prima della chiamata booking")
        await generateTratte(eventId);
        console.log("dopo della chiamata booking")

        const updatedEvent = await Event.findById(eventId)
          .populate('location', 'name address')
          .populate('organizer', 'companyName email');

        return res.status(200).json({ booking: existing, event: updatedEvent });
      }
    }

    // Nuova prenotazione
    const booking = new Booking({
      user: userId,
      event: eventId,
      status: 'confirmed',
      paymentStatus: 'paid'
    });

    await booking.save();

    // Crea preferenza se non esiste e incrementa popolarità
    const pref = await EventPreference.findOne({ user: userId, event: eventId });
    if (!pref) {
      await EventPreference.create({ user: userId, event: eventId });
      await Event.findByIdAndUpdate(eventId, { $inc: { popularity: 1 } });
    }
    

    // Verifica tratta
    await generateTratte(eventId);

    const updatedEvent = await Event.findById(eventId)
      .populate('location', 'name address')
      .populate('organizer', 'companyName email');

    return res.status(200).json({ booking, event: updatedEvent });
  } catch (error) {
    console.error("Errore nella creazione della prenotazione:", error);
    res.status(500).json({ message: 'Errore nella creazione della prenotazione' });
  }
};


// Annulla prenotazione (solo se gratuita e confermata)
const cancelBooking = async (req, res) => {
  if (!req.user?.userId) {
    return res.status(401).json({ message: 'Autenticazione richiesta per effettuare questa operazione.' });
  }
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

    const pref = await EventPreference.findOneAndDelete({ user: userId, event: booking.event });
    if (pref) {
      await Event.findByIdAndUpdate(booking.event, { $inc: { popularity: -1 } });
    }

    res.json({ message: 'Prenotazione annullata con successo.' });
  } catch (error) {
    console.error('Errore durante l\'annullamento della prenotazione:', error);
    res.status(500).json({ message: 'Errore durante l\'annullamento della prenotazione' });
  }
};

const validateTicket = async (req, res) => {
  if (!req.user?.userId) {
    return res.status(401).json({ message: 'Autenticazione richiesta per effettuare questa operazione.' });
  }
  const { ticketId, eventId } = req.body;
  const organizerId = req.user.userId;

  try {
    // 1. Verifica che l’evento appartenga all'organizer
    const event = await Event.findOne({ _id: eventId, organizer: organizerId });
    if (!event) {
      return res.status(403).json({ valid: false, reason: 'Evento non trovato o non autorizzato.' });
    }

    // 2. Trova la prenotazione
    const booking = await Booking.findOne({
      _id: ticketId,
      event: eventId,
      status: 'confirmed',
      paymentStatus: 'paid'
    });

    if (!booking) {
      return res.status(404).json({ valid: false, reason: 'Biglietto non valido o inesistente.' });
    }

    // 3. Controlla se già usato
    if (booking.checkedIn) {
      return res.status(200).json({ valid: false, reason: 'Biglietto già usato.' });
    }

    // 4. Segna come usato
    booking.checkedIn = true;
    await booking.save();

    return res.status(200).json({ valid: true, message: 'Biglietto valido. Accesso consentito.' });
  } catch (err) {
    console.error('Errore durante la validazione del biglietto:', err);
    return res.status(500).json({ valid: false, reason: 'Errore del server' });
  }
};


module.exports = {
  getTicketForEvent,
  getClientBookings,
  createBooking,
  cancelBooking,
  validateTicket
};
