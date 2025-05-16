// src/controllers/eventSearchController.js

const Event = require('../models/eventModel');

async function searchEvents(req, res) {
    try {
        const { query } = req.query;

        if (!query || query.trim() === "") {
            return res.status(400).json({ message: "Il parametro di ricerca è richiesto" });
        }

        // Cerca eventi che contengono il testo del query in più campi
        const events = await Event.find({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { location: { $regex: query, $options: 'i' } }
            ]
        }).populate('organizer', 'name email'); // Popola i dati dell'organizzatore

        res.status(200).json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Errore del server" });
    }
}

module.exports = { searchEvents };

