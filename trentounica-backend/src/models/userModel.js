// src/models/userModel.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: { 
    type: String, 
    required: true, 
    minlength: 8,
    maxlength: 20,
    validate: {
      validator: function(value) {
        return (
          value.length >= 8 &&
          value.length <= 20 &&
          /[a-z]/.test(value) &&    // Almeno una lettera minuscola
          /[A-Z]/.test(value) &&    // Almeno una lettera maiuscola
          /[0-9]/.test(value) &&    // Almeno un numero
          /[^a-zA-Z0-9]/.test(value) // Almeno un carattere speciale
        );
      },
      message: 'La password deve avere tra 8 e 20 caratteri, con almeno una lettera minuscola, una lettera maiuscola, un numero e un carattere speciale.'
    }
  },
  role: { 
    type: String, 
    enum: ['client', 'organizer'], 
    default: 'client' 
  },
});

module.exports = mongoose.model('User', userSchema);