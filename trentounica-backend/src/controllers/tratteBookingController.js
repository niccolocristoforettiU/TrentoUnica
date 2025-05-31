const Tratta = require('../models/trattaModel');
const TrattaBooking = require('../models/trattaBooking');

const bookTratta = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { trattaId } = req.body;

    const tratta = await Tratta.findById(trattaId).populate('event');
    if (!tratta || !tratta.active) {
      return res.status(400).json({ message: 'Tratta non disponibile.' });
    }

    if (tratta.bookingCount >= tratta.capacity) {
      return res.status(400).json({ message: 'Nessun posto disponibile.' });
    }

    // Controlla se esiste una prenotazione cancellata per questa tratta
    const existing = await TrattaBooking.findOne({
      user: userId,
      tratta: trattaId
    });

    if (existing) {
      if (existing.status === 'confirmed') {
        return res.status(400).json({ message: 'Hai già prenotato questa tratta.' });
      }

      // Riattiva la prenotazione cancellata
      existing.status = 'confirmed';
      await existing.save();
    } else {
      await TrattaBooking.create({ user: userId, tratta: trattaId });
    }

    tratta.bookingCount += 1;
    await tratta.save();

    res.json({ message: 'Prenotazione tratta confermata.' });
  } catch (err) {
    console.error('❌ Errore nella prenotazione tratta:', err);
    res.status(500).json({ message: 'Errore interno del server.' });
  }
};



const cancelTrattaBooking = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bookingId } = req.params;

    const booking = await TrattaBooking.findOne({ _id: bookingId, user: userId });
    if (!booking) {
      return res.status(404).json({ message: 'Prenotazione tratta non trovata.' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Questa prenotazione è già stata annullata.' });
    }

    booking.status = 'cancelled';
    await booking.save();

    await Tratta.findByIdAndUpdate(booking.tratta, { $inc: { bookingCount: -1 } });

    res.json({ message: 'Prenotazione tratta annullata con successo.' });
  } catch (err) {
    console.error('Errore durante annullamento tratta:', err);
    res.status(500).json({ message: 'Errore durante l\'annullamento della prenotazione tratta.' });
  }
};

const getClientTrattaBookings = async (req, res) => {
  try {
    const userId = req.user.userId;

    const bookings = await TrattaBooking.find({
      user: userId,
      status: 'confirmed'
    }).populate({
      path: 'tratta',
      populate: { path: 'event', select: 'title date location' }
    });

    // Aggiungi qrCodeData a ogni prenotazione
    const bookingsWithQR = bookings.map(booking => {
      const obj = booking.toObject();
      return {
        ...obj,
        qrCodeData: booking._id.toString()
      };
    });

    res.json(bookingsWithQR);
  } catch (err) {
    console.error('Errore nel recupero tratte:', err);
    res.status(500).json({ message: 'Errore del server' });
  }
};


const getTicketForTratta = async (req, res) => {
  const userId = req.user?.userId;
  const trattaId = req.params.trattaId;

  if (!userId) {
    return res.status(401).json({ message: 'Autenticazione richiesta.' });
  }

  try {
    const booking = await TrattaBooking.findOne({
      user: userId,
      tratta: trattaId,
      status: 'confirmed'
    }).populate({
      path: 'tratta',
      populate: { path: 'event', select: 'title date location' }
    });

    if (!booking) {
      return res.status(200).json({ hasBooking: false });
    }

    const { title, date, location } = booking.tratta.event;

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
    console.error('Errore nel recupero ticket tratta:', err);
    res.status(500).json({ message: 'Errore durante il recupero del biglietto tratta.' });
  }
};

const validateTrattaTicket = async (req, res) => {
  const userId = req.user?.userId;
  const userRole = req.user?.role;
  const { ticketId, trattaId } = req.body;

  try {
    // 1. Controlla che sia un utente trasporti
    if (userRole !== 'trasporti') {
      return res.status(403).json({ valid: false, reason: 'Accesso riservato ai trasporti.' });
    }

    // 2. Controllo che la tratta esista
    const tratta = await Tratta.findById(trattaId);
    if (!tratta) {
      return res.status(404).json({ valid: false, reason: 'Tratta non trovata.' });
    }

    // 3. Trova la prenotazione
    const booking = await TrattaBooking.findOne({
      _id: ticketId,
      tratta: trattaId,
      status: 'confirmed'
    });

    if (!booking) {
      return res.status(404).json({ valid: false, reason: 'Biglietto non valido o inesistente.' });
    }

    // 4. Check-in già fatto?
    if (booking.checkedIn) {
      return res.status(200).json({ valid: false, reason: 'Biglietto già usato.' });
    }

    // 5. Marca come check-in
    booking.checkedIn = true;
    await booking.save();

    return res.status(200).json({ valid: true, message: 'Biglietto valido. Accesso consentito.' });

  } catch (err) {
    console.error('Errore nella validazione della tratta:', err);
    return res.status(500).json({ valid: false, reason: 'Errore del server' });
  }
};



module.exports = {
  bookTratta,
  cancelTrattaBooking,
  getClientTrattaBookings,
  getTicketForTratta,
  validateTrattaTicket
};