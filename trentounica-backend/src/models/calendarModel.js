// src/models/calendarModel.js

const mongoose = require("mongoose");

const calendarSchema = new mongoose.Schema({
    name: String,
    description: String,
    date: { type: Date, required: true },
    endDate: { type: Date },
    events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isPublic: { type: Boolean, default: true },
}, {
    timestamps: true
});

// Usa "Calendar" come nome del modello, non "Event"
module.exports = mongoose.models.Calendar || mongoose.model("Calendar", calendarSchema);
