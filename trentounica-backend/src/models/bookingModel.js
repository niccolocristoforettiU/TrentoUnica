// src/models/bookingModel.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  paymentStatus: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid' },
});

module.exports = mongoose.model('Booking', bookingSchema);