// src/models/eventModel.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  location: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Location',
    required: true 
  },
  price: { type: Number, default: 0 },
  organizer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  category: { 
    type: String, 
    enum: ["bar", "discoteca", "concerto"], 
    required: true 
  },
  popularity: { type: Number, default: 0 },
}, {
  timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);