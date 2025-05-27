// src/routes/calendarRoutes.js

const express = require("express");
const router = express.Router();
const { authenticate, optionalAuthenticate } = require("../middlewares/authMiddleware");
const calendarController = require("../controllers/calendarController");
const Event = require("../models/eventModel");
// Esporta tutti gli eventi filtrati per data

router.get("/export", authenticate, calendarController.getICalendar);
router.get("/export/:id", authenticate, calendarController.getSingleEventICalendar);

// Elenco eventi (filtrabili per data)
router.get("/", optionalAuthenticate, async (req, res) => {
    try {
        const { startDate, endDate, category, onlyMine, onlyPreferred } = req.query;
        const filter = {};

        if (startDate) filter.date = { $gte: new Date(startDate) };
        if (endDate) filter.date = { ...filter.date, $lte: new Date(endDate) };

        if (onlyMine === 'true' && req.user?.role === 'organizer') {
            filter.organizer = req.user.userId;
        }

        if (onlyPreferred === 'true' && req.user?.role === 'client') {
            const EventPreference = require('../models/eventPreferenceModel');
            const prefs = await EventPreference.find({ user: req.user.userId }).select('event');
            const preferredEventIds = prefs.map(p => p.event.toString());

            if (preferredEventIds.length > 0) {
                filter._id = { $in: preferredEventIds };
            } else {
                return res.json([]);
            }
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
