const Event = require('../models/eventModel');

async function searchEvents(req, res) {
    try {
        const { query, category, sortByDate, sortByPopularity, onlyUpcoming } = req.query;
        const filter = {};

        // Mostra solo eventi futuri
        if (onlyUpcoming === "true") {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Imposta a mezzanotte
            filter.date = { $gte: today };
            console.log("Filtro combinato finale:", filter);

        }

        // Filtro per testo (titolo, descrizione, location se stringa)
        if (query && query.trim() !== "") {
            filter.$or = [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { location: { $regex: query, $options: 'i' } } // solo se location è stringa!
            ];
        }

        // Filtro per categoria
        if (category && category.trim() !== "") {
            filter.category = category;
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
