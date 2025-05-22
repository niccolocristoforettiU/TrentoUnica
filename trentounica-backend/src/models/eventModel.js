// src/models/eventModel.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  duration: { type: Number, required: true },
  location: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Location',
    required: true 
  },
  category: { type: String },
  price: { type: Number, default: 0 },
  organizer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  popularity: { type: Number, default: 0 },
  bookingRequired: { type: Boolean, default: false },
}, {
  timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);