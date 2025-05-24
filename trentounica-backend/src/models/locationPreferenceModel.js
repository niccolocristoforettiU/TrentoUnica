// src/models/locationPreferenceModel.js
const mongoose = require('mongoose');

const locationPreferenceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true }
}, { timestamps: true });

locationPreferenceSchema.index({ user: 1, location: 1 }, { unique: true });

module.exports = mongoose.model('LocationPreference', locationPreferenceSchema);