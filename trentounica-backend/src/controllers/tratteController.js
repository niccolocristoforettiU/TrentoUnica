const Tratta = require('../models/trattaModel');
const { generateTratte } = require('../utils/tratteUtils');

// 🔹 Cambio stato da parte dei trasporti
const updateTrattaStatusByTransport = async (req, res) => {
  try {
    const { id } = req.params;
    const { newStatus } = req.body;
    const tratta = await Tratta.findById(id);

    if (!tratta) return res.status(404).json({ message: 'Tratta non trovata.' });

    const validTransitions = {
      pending: ['transportApproved', 'rejectedByTransport'],
      rejectedByTransport: ['pending'],
      adminApproved: ['finished']
    };

    const current = tratta.status;
    if (!validTransitions[current]?.includes(newStatus)) {
      return res.status(400).json({ message: `Transizione non valida da ${current} a ${newStatus}` });
    }

    // ✅ Block transition if it's not at least 1 day after the tratta date
    if (current === 'adminApproved' && newStatus === 'finished') {
      const now = new Date();
      const trattaDate = new Date(tratta.date);

      // Calculate the difference in milliseconds
      const diffInMs = now - trattaDate;

      // 1 day = 24 * 60 * 60 * 1000 milliseconds
      if (diffInMs < 24 * 60 * 60 * 1000) {
        return res.status(400).json({
          message: 'Puoi concludere una tratta solo almeno un giorno dopo la sua data.'
        });
      }
    }

    tratta.status = newStatus;
    await tratta.save();

    res.json({ message: `Stato aggiornato a ${newStatus}`, tratta });
  } catch (err) {
    console.error('Errore cambio stato trasporti:', err);
    res.status(500).json({ message: 'Errore interno.' });
  }
};


// 🔹 Cambio stato da parte dell'admin
const updateTrattaStatusByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { newStatus } = req.body;
    const tratta = await Tratta.findById(id);

    if (!tratta) return res.status(404).json({ message: 'Tratta non trovata.' });

    const validTransitions = {
      transportApproved: ['adminApproved', 'rejectedByAdmin'],
      rejectedByAdmin: ['transportApproved']
    };

    const current = tratta.status;
    if (!validTransitions[current]?.includes(newStatus)) {
      return res.status(400).json({ message: `Transizione non valida da ${current} a ${newStatus}` });
    }

    tratta.status = newStatus;
    await tratta.save();

    res.json({ message: `Stato aggiornato a ${newStatus}`, tratta });
  } catch (err) {
    console.error('Errore cambio stato admin:', err);
    res.status(500).json({ message: 'Errore interno.' });
  }
};

// 🔹 GET tratte filtrate per stato e data
const getTratteByStatusAndDate = async (req, res) => {
  try {
    const { status } = req.params;
    const { startDate, endDate } = req.query;

    const allowedStatuses = ['pending', 'transportApproved', 'adminApproved', 'rejectedByTransport', 'rejectedByAdmin', 'active', 'finished'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Status non valido.' });
    }

    const filter = { status };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const tratte = await Tratta.find(filter).populate('event').populate('users');
    res.json(tratte);
  } catch (error) {
    console.error('Errore getTratteByStatusAndDate:', error);
    res.status(500).json({ message: 'Errore nel recupero tratte', error: error.message });
  }
};

const generateTratteForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const tratte = await generateTratte(eventId); // or any logic you need
    res.json({ tratte });
  } catch (err) {
    console.error("Errore generazione tratte:", err);
    res.status(500).json({ message: "Errore generazione tratte." });
  }
};

const updateTrattaByTransport = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const tratta = await Tratta.findById(id);
    if (!tratta) {
      return res.status(404).json({ message: 'Tratta non trovata.' });
    }

    // ✅ Verifica che la tratta sia nello stato modificabile
    const modifiableStatuses = ['pending', 'transportApproved', 'adminApproved'];
    if (!modifiableStatuses.includes(tratta.status)) {
      return res.status(403).json({ message: 'Non puoi modificare questa tratta in questo stato.' });
    }

    // ✅ Applica solo i campi ammessi alla modifica
    const allowedFields = ['departureTime', 'capacity', 'midpoint']; // aggiorna con i campi che vuoi permettere
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        tratta[field] = updates[field];
      }
    });

    await tratta.save();
    res.json({ message: 'Tratta aggiornata con successo', tratta });

  } catch (err) {
    console.error('Errore aggiornamento tratta (trasporti):', err);
    res.status(500).json({ message: 'Errore interno.' });
  }
};

module.exports = {
  updateTrattaStatusByTransport,
  updateTrattaStatusByAdmin,
  getTratteByStatusAndDate,
  generateTratteForEvent,
  updateTrattaByTransport
};
