const mongoose = require('mongoose');

const trattaSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  midpoint: {
    lat: { type: Number, required: true },
    lon: { type: Number, required: true }
  },
  departureTime: { type: Date, required: true },
  date: { type: Date, required: true },
  estimatedDuration: { type: Number, required: true },
  capacity: { type: Number, required: true },

  // Stato complessivo della tratta
  status: {
    type: String,
    enum: ['pending', 'transportApproved', 'adminApproved', 'rejectedByTransport', 'rejectedByAdmin', 'active', 'finished'],
    default: 'pending'
  },

  // Visibilità e disponibilità per prenotazione
  active: { type: Boolean, default: false },

  // Numero di prenotazioni confermate
  bookingCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Tratta', trattaSchema);
