const Event = require('../models/eventModel');
const Location = require('../models/locationModel');
const Booking = require('../models/bookingModel');
// Elenco eventi (pubblici)
const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate('location', 'name address category')
      .populate('organizer', 'companyName email');
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero degli eventi', error: error.message });
  }
};

// Ottenere gli eventi gestiti dall'organizer autenticato
const getOrganizerEvents = async (req, res) => {
  try {
    const organizerId = req.user.userId;
    const events = await Event.find({ organizer: organizerId })
      .populate('location', 'name address category')
      .populate('organizer', 'companyName email');
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero degli eventi per l\'organizer.', error: error.message });
  }
};

// Creazione evento con verifica permessi location e categoria
const createEvent = async (req, res) => {
  try {
    const { title, description, date, locationId, price, category, duration, bookingRequired} = req.body;
    const userId = req.user.userId;
    const loc = await Location.findOne({ _id: locationId, organizer: userId });
    if (!loc) {
      return res.status(400).json({ message: 'Location non valida o non gestita da questo organizer.' });
    }

    const event = new Event({
      title,
      description,
      date,
      duration,
      location: loc._id,
      category,
      price,
      organizer: userId,
      bookingRequired
    });

    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Errore durante la creazione dell\'evento', error: error.message });
  }
};

// Ottenere tutte le location disponibili per la creazione degli eventi
const getLocations = async (req, res) => {
  try {
    const locations = await Location.find({ organizer: req.user.userId }).populate('organizer', 'companyName email');
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero delle locations', error: error.message });
  }
};

// Dettagli evento
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('location', 'name address category maxSeats')
      .populate('organizer', 'companyName email');
    if (!event) return res.status(404).json({ message: 'Evento non trovato' });

    // Conta i booking confermati e pagati
    const bookingCount = await Booking.countDocuments({
      event: event._id,
      status: 'confirmed',
      paymentStatus: 'paid'
    });

     // Aggiungi bookingCount al risultato
    const eventObj = event.toObject();
    eventObj.bookingCount = bookingCount;

    res.json(eventObj);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero dell\'evento' });
  }
};

// Modifica evento
const updateEvent = async (req, res) => {
  try {
    const { title, description, date, locationId, price, duration, bookingRequired } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Evento non trovato' });

    const loc = await Location.findOne({ _id: locationId, organizer: req.user.userId });
    if (!loc) {
      return res.status(400).json({ message: 'Location non valida o non gestita da questo organizer.' });
    }

    event.title = title;
    event.description = description;
    event.date = date;
    event.duration = duration;
    event.location = loc._id;
    event.price = price;
    event.bookingRequired = bookingRequired;

    await event.save();
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Errore durante l\'aggiornamento dell\'evento', error: error.message });
  }
};

// Eliminazione evento
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Evento non trovato' });
    }

    if (!event.organizer || event.organizer.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Non autorizzato a eliminare questo evento' });
    }

    await event.deleteOne(); // <-- questa è la soluzione!
    res.json({ message: 'Evento eliminato con successo' });
  } catch (error) {
    console.error("Errore durante l'eliminazione:", error);
    res.status(500).json({ message: 'Errore durante l\'eliminazione dell\'evento', error: error.message });
  }
};

const getEventsWithBookingCounts = async (req, res) => {
  const events = await Event.find({ organizer: req.user.userId })
    .populate('location', 'name address category');

  const data = await Promise.all(events.map(async (event) => {
    const count = await Booking.countDocuments({
      event: event._id,
      status: 'confirmed'
    });

    return {
      ...event.toObject(),
      bookingCount: count
    };
  }));

  res.json(data);
};



// Esportazione delle funzioni del controller
module.exports = {
  getAllEvents,
  getOrganizerEvents,
  createEvent,
  getLocations,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventsWithBookingCounts
};