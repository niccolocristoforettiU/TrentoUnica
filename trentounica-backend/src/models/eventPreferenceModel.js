// src/models/eventPreferenceModel.js
const mongoose = require('mongoose');

const eventPreferenceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function () {
      return !this.guestId;
    }
  },
  guestId: {
    type: String,
    required: function () {
      return !this.user;
    }
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  }
}, {
  timestamps: true
});

// Evita duplicati: un utente o guest può esprimere una preferenza una sola volta per evento
eventPreferenceSchema.index(
  { user: 1, guestId: 1, event: 1 },
  {
    unique: true,
    partialFilterExpression: { event: { $exists: true } }
  }
);

module.exports = mongoose.model('EventPreference', eventPreferenceSchema);
