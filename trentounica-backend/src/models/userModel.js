// models/userModel.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true,
    match: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
    validate: {
      validator: function(value) {
        return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value);
      },
      message: "L'email non è valida. Deve essere nel formato testo@testo.estensione."
    }
  },
  password: { 
    type: String, 
    required: true, 
    minlength: 8,
    maxlength: 100 // Permetti l'hash bcrypt
  },
  role: { 
    type: String, 
    enum: ['client', 'organizer'], 
    default: 'client' 
  },
});

// Cripta la password prima di salvarla
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    // Cripta solo se è una nuova password
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

module.exports = mongoose.model('User', userSchema);
