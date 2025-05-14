// Aggiungi questo codice a uno script separato (es. createTestEvents.js) se vuoi inserire dati di test

const mongoose = require("mongoose");
require("dotenv").config();
const Event = require("./models/eventModel");

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const testEvents = [
    {
        title: "Evento 1",
        description: "Primo evento di test",
        date: new Date("2025-05-15T10:00:00Z"),
        location: "Trento",
        createdBy: "64d2c927d6179c26c8b66e0a",
        isPublic: true,
    },
    {
        title: "Evento 2",
        description: "Secondo evento di test",
        date: new Date("2025-05-16T14:00:00Z"),
        location: "Rovereto",
        createdBy: "64d2c927d6179c26c8b66e0a",
        isPublic: true,
    },
];

async function createTestEvents() {
    try {
        await Event.insertMany(testEvents);
        console.log("Eventi di test creati con successo!");
        process.exit();
    } catch (error) {
        console.error("Errore durante la creazione degli eventi di test:", error);
        process.exit(1);
    }
}

createTestEvents();
