// src/routes/calendarRoutes.js

const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/authMiddleware");
const calendarController = require("../controllers/calendarController");
const Event = require("../models/eventModel");
// Esporta tutti gli eventi filtrati per data

router.get("/export", authenticate, calendarController.getICalendar);
router.get("/export/:id", authenticate, calendarController.getSingleEventICalendar);

// Elenco eventi (filtrabili per data)
router.get("/", authenticate, async (req, res) => {
    try {
        const { startDate, endDate, category, onlyMine } = req.query;
        const filter = {};

        if (startDate) filter.date = { $gte: new Date(startDate) };
        if (endDate) filter.date = { ...filter.date, $lte: new Date(endDate) };

        if (onlyMine === 'true' && req.user?.role === 'organizer') {
            filter.organizer = req.user.userId;
        }

        const events = await Event.find(filter)
            .populate({
                path: "location",
                match: category ? { category } : {}
            })
            .populate("organizer")
            .sort({ date: 1 });

        // Rimuove eventi senza location (non corrispondente alla categoria)
        const filteredEvents = events.filter(e => e.location !== null);

        res.json(filteredEvents);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Errore nel recupero degli eventi" });
    }
});

module.exports = router;
