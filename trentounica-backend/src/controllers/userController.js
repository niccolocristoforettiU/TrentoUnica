// src/controllers/userController.js
const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// src/controllers/userController.js

exports.register = async (req, res) => {
  try {
    const { name, email, password, ripetiPassword } = req.body;
    
    // Controllo se le password coincidono
    if (password !== ripetiPassword) {
      return res.status(400).json({ message: 'Le password non coincidono' });
    }

    // Controlla che la password rispetti i criteri prima dell'hashing
    const isValid = (
        password.length >= 8 &&
        password.length <= 20 &&
        /[a-z]/.test(password) &&
        /[A-Z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^a-zA-Z0-9]/.test(password)
    );

    if (!isValid) {
      return res.status(400).json({ message: "La password deve avere tra 8 e 20 caratteri, con almeno una lettera minuscola, una lettera maiuscola, un numero e un carattere speciale." });
    }

    // Controllo se l'email esiste già
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email già registrata' });
    }

    // Crea un nuovo utente (NON criptare manualmente)
    const user = new User({ name, email, password });
    await user.save();

    res.status(201).json({ message: 'Registrazione avvenuta con successo' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Errore durante la registrazione', error: error.message });
  }
};


// Login utente
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Credenziali non valide' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenziali non valide' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    res.status(200).json({ token, role: user.role });
  } catch (error) {
    res.status(500).json({ message: 'Errore durante il login', error: error.message });
  }
};

// Ottenere il profilo utente (Protetto)
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Errore durante il recupero del profilo', error: error.message });
  }
};

// Aggiornare il profilo utente (Protetto)
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, newPassword, confirmPassword } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (email) updates.email = email;

    // Controllo se le nuove password coincidono
    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Le nuove password non coincidono' });
      }

      // Hash della nuova password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updates.password = hashedPassword;
    }

    const user = await User.findByIdAndUpdate(req.user.userId, updates, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    res.status(200).json({ message: 'Profilo aggiornato con successo', user });
  } catch (error) {
    res.status(500).json({ message: 'Errore durante l\'aggiornamento del profilo', error: error.message });
  }
};