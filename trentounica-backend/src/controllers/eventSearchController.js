const Event = require('../models/eventModel');

async function searchEvents(req, res) {
    try {
        const { query, category, sortByDate, sortByPopularity, onlyUpcoming, onlyMine, onlyPreferred, onlyEventPreferred } = req.query;
        const filter = {};

        // Blocca filtri avanzati per guest
        if (!req.user && (onlyMine === 'true' || onlyPreferred === 'true' || onlyEventPreferred === 'true')) {
            return res.status(403).json({ message: 'Filtri riservati agli utenti registrati' });
        }

        // Mostra solo eventi futuri
        if (onlyUpcoming === "true") {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Imposta a mezzanotte
            filter.date = { $gte: today };
            console.log("Filtro combinato finale:", filter);

        }

        // Filtro per testo (titolo)
        if (query && query.trim() !== "") {
            filter.$or = [
                { title: { $regex: query, $options: 'i' } },
            ];
        }

        // Filtro per categoria
        if (category && category.trim() !== "") {
            filter.category = category;
        }

        if (onlyMine === 'true' && req.user?.role === 'organizer') {
            filter.organizer = req.user.userId;
        }

        if (onlyPreferred === 'true' && req.user?.role === 'client') {
            const LocationPreference = require('../models/locationPreferenceModel');
            const prefs = await LocationPreference.find({ user: req.user.userId }).select('location');
            const preferredLocationIds = prefs.map(p => p.location.toString());
            filter.location = { $in: preferredLocationIds };
        }

        if (onlyEventPreferred === 'true' && req.user?.role === 'client') {
            const EventPreference = require('../models/eventPreferenceModel');
            const prefs = await EventPreference.find({ user: req.user.userId }).select('event');
            const preferredEventIds = prefs.map(p => p.event);
            filter._id = { $in: preferredEventIds };
        }

        // Imposta ordinamento
        let sortOption = { date: 1 }; // default: eventi dal più vicino

        if (sortByDate === "true") {
            sortOption = { date: -1 };
        }

        if (sortByPopularity === "true") {
            sortOption = { popularity: -1 };
        }

        const events = await Event.find(filter)
            .populate('organizer', 'name email')
            .sort(sortOption);
console.log("Eventi trovati:", events.map(e => ({ title: e.title, date: e.date })));

        res.status(200).json(events);
    } catch (error) {
        console.error("Errore durante la ricerca degli eventi:", error);
        res.status(500).json({ message: "Errore del server durante la ricerca degli eventi" });
    }
}

module.exports = { searchEvents };
