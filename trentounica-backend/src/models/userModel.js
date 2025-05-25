const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: function() {
      return this.role === 'client';
    },
    trim: true
  },
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
    maxlength: 100
  },
  role: { 
    type: String, 
    enum: ['client', 'organizer', 'admin', 'trasporti'], 
    default: 'client' 
  },
  address: {
    type: String,
    required: function() {
      return this.role === 'client';
    },
    trim: true
  },
  lat: {
    type: Number,
    required: function () {
      return this.role === 'client';
    }
  },
  lon: {
    type: Number,
    required: function () {
      return this.role === 'client';
    }
  },
  birthDate: {
    type: Date,
    required: function() {
      return this.role === 'client';
    }
  },
  companyName: {
    type: String,
    required: function() {
      return this.role === 'organizer';
    },
    trim: true
  },
  partitaIva: {
    type: String,
    required: function() {
      return this.role === 'organizer';
    },
    validate: {
      validator: function(v) {
        return /^[0-9]{11}$/.test(v);
      },
      message: props => `${props.value} non è un formato valido di Partita IVA.`
    }
  },
  locations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location'
  }],
  verified: { 
    type: Boolean, 
    default: function() {
      return this.role === 'client' || this.role === 'admin' || this.role === 'trasporti' ;
    }
  }
});

// Cripta la password prima di salvarla
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || this.password.startsWith("$2b$")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('User', userSchema);
