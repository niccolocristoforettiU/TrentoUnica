const EventPreference = require('../models/eventPreferenceModel');
const Event = require('../models/eventModel');

// Verifica se l'utente ha già espresso una preferenza per un evento
exports.checkPreference = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const guestId = req.headers['x-guest-id'];
    const eventId = req.params.eventId;

    const pref = await EventPreference.findOne({ event: eventId, ...(userId ? { user: userId } : { guestId }) });
    if (!pref) return res.status(200).json({ hasPreference: false });
    res.status(200).json({ hasPreference: true });
  } catch (error) {
    res.status(500).json({ message: 'Errore durante il controllo della preferenza', error: error.message });
  }
};

// Aggiunge una preferenza
exports.expressPreference = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.userId;
    const guestId = req.headers['x-guest-id'];

    if (!userId && !guestId) {
      return res.status(401).json({ message: 'Utente non autenticato o guestId mancante' });
    }

    await EventPreference.create({ user: userId, guestId, event: eventId });
    await Event.findByIdAndUpdate(eventId, { $inc: { popularity: 1 } });

    res.status(200).json({ message: 'Preferenza registrata' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Preferenza già espressa' });
    }
    res.status(500).json({ message: 'Errore nella preferenza', error: error.message });
  }
};

// Rimuove una preferenza
exports.removePreference = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.userId;
    const guestId = req.headers['x-guest-id'];

    if (!userId && !guestId) {
      return res.status(401).json({ message: 'Utente non autenticato o guestId mancante' });
    }

    const pref = await EventPreference.findOneAndDelete({ event: eventId, ...(userId ? { user: userId } : { guestId }) });
    if (pref) {
      await Event.findByIdAndUpdate(eventId, { $inc: { popularity: -1 } });
    }

    res.status(200).json({ message: 'Preferenza rimossa' });
  } catch (error) {
    res.status(500).json({ message: 'Errore nella rimozione preferenza', error: error.message });
  }
};
