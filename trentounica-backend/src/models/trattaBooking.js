const mongoose = require('mongoose');

const trattaBookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tratta: { type: mongoose.Schema.Types.ObjectId, ref: 'Tratta', required: true },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled'],
    default: 'confirmed'
  },
  checkedIn: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

trattaBookingSchema.index({ user: 1, tratta: 1 }, { unique: true });

module.exports = mongoose.model('TrattaBooking', trattaBookingSchema);