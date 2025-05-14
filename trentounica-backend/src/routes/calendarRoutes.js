// src/routes/calendarRoutes.js

const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/authMiddleware");
const calendarController = require("../controllers/calendarController");
const Event = require("../models/eventModel");
// Esporta tutti gli eventi pubblici
router.get("/export", authenticate, calendarController.getICalendar);

// Elenco eventi (aggiungi questa rotta se manca)
router.get("/", authenticate, async (req, res) => {
    try {
        const events = await Event.find({ isPublic: true });
        res.json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Errore nel recupero degli eventi" });
    }
});

module.exports = router;
