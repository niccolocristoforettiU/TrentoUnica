// src/models/eventPreferenceModel.js
const mongoose = require('mongoose');

const eventPreferenceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  }
}, {
  timestamps: true
});

// Evita duplicati: un utente può esprimere una preferenza una sola volta per evento
eventPreferenceSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('EventPreference', eventPreferenceSchema);
