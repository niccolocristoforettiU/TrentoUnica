// src/controllers/eventSearchController.js

const Event = require('../models/eventModel');

async function searchEvents(req, res) {
    try {
        const { query, category, sortByDate, sortByPopularity } = req.query;
        const filter = {};

        // Filtro per titolo, descrizione o location
        if (query && query.trim() !== "") {
            filter.$or = [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { location: { $regex: query, $options: 'i' } }
            ];
        }

        // Filtro per categoria
        if (category && category.trim() !== "") {
            filter.category = category;
        }

        console.log("Filtro applicato:", filter);

        // Ottieni gli eventi filtrati
        let events = await Event.find(filter).populate('organizer', 'name email');

        console.log("Eventi trovati:", events);

        // Ordina per data (dal più recente)
        if (sortByDate === "true") {
            events = events.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        // Ordina per popolarità (se definito)
        if (sortByPopularity === "true") {
            events = events.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        }

        console.log("Eventi dopo l'ordinamento:", events);

        res.status(200).json(events);
    } catch (error) {
        console.error("Errore durante la ricerca degli eventi:", error);
        res.status(500).json({ message: "Errore del server durante la ricerca degli eventi" });
    }
}

module.exports = { searchEvents };
