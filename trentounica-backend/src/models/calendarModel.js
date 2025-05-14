// src/models/calendarModel.js

const mongoose = require("mongoose");

const calendarSchema = new mongoose.Schema({
    name: String,
    description: String,
    events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    createdBy: mongoose.Schema.Types.ObjectId,
    isPublic: Boolean,
});

// Usa "Calendar" come nome del modello, non "Event"
module.exports = mongoose.models.Calendar || mongoose.model("Calendar", calendarSchema);
