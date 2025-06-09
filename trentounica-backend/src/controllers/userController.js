// src/controllers/userController.js
const User = require('../models/userModel');
const Location = require('../models/locationModel');
const LocationPreference = require('../models/locationPreferenceModel');
const Event = require('../models/eventModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendAccountActivationEmail, sendPasswordResetEmail } = require('../services/emailService');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

exports.register = async (req, res) => {
  try {
    const {
      name, email, password, ripetiPassword, role,
      companyName, address, birthDate, partitaIva, locations,
      lat, lon // aggiunti per il client
    } = req.body;

    if (password !== ripetiPassword) {
      return res.status(400).json({ message: 'Le password non coincidono' });
    }

    if (role === 'client' && (!address || !birthDate || lat == null || lon == null)) {
      return res.status(400).json({ message: 'Indirizzo, data di nascita e coordinate sono obbligatorie per i clienti.' });
    }

    if (role === 'organizer' && (!partitaIva || !locations || !Array.isArray(locations))) {
      return res.status(400).json({ message: 'Partita IVA e location sono obbligatorie per gli organizzatori.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(200).json({ message: 'Utente già registrato, puoi effettuare il login.' });
    }

    // Creazione utente (aggiunti lat/lon per client)
    const user = new User({
      name: role === 'client' ? name : undefined,
      email,
      password,
      role,
      address: role === 'client' ? address : undefined,
      birthDate: role === 'client' ? birthDate : undefined,
      lat: role === 'client' ? lat : undefined,
      lon: role === 'client' ? lon : undefined,
      companyName: role === 'organizer' ? companyName : undefined,
      partitaIva: role === 'organizer' ? partitaIva : undefined,
      verified: role === 'client'
    });

    await user.save();

    // Gestione location per organizer
    if (role === 'organizer' && Array.isArray(locations) && locations.length > 0) {
      const validLocations = [];

      for (const location of locations) {
        const {
          name, address, openingTime, closingTime,
          maxSeats, category, lat, lon // aggiunti lat/lon per location
        } = location;

        if (!name || !address || !openingTime || !closingTime || !maxSeats || !category || lat == null || lon == null) {
          console.error("Location non valida:", location);
          continue;
        }

        // Verifica se già esiste
        const existingLocation = await Location.findOne({
          name: name.trim(),
          address: address.trim(),
          organizer: user._id
        });

        if (existingLocation) {
          console.log(`Location già esistente per l'organizer: ${existingLocation.name} - ${existingLocation.address}`);
          validLocations.push(existingLocation._id);
          continue;
        }

        //Crea nuova location con lat/lon
        const newLocation = await Location.create({
          name: name.trim(),
          address: address.trim(),
          openingTime,
          closingTime,
          maxSeats,
          category,
          lat,
          lon,
          organizer: user._id
        });

        validLocations.push(newLocation._id);
      }

      // Associa le location all’utente
      await User.findByIdAndUpdate(user._id, { locations: validLocations });
    }

    res.status(201).json({
      message: role === 'organizer'
        ? 'Registrazione come organizer in attesa di verifica.'
        : 'Registrazione avvenuta con successo.'
    });
  } catch (error) {
    console.error("Errore durante la registrazione:", error);
    res.status(500).json({ message: 'Errore durante la registrazione', error: error.message });
  }
};

// Verificare se l'utente è un organizzatore
exports.verifyOrganizer = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Trova l'utente con l'ID specificato
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    // Verifica se l'utente è un organizzatore
    if (user.role !== 'organizer') {
      return res.status(403).json({ message: 'Utente non autorizzato come organizzatore' });
    }

    // Aggiorna il ruolo dell'utente (opzionale, se vuoi promuoverlo a "organizer")
    //user.role = 'organizer';
    user.verified = true;
    await user.save();

    // Invia l'email di attivazione
    try {
      await sendAccountActivationEmail(user.email, user.companyName || user.name);
    } catch (emailErr) {
      console.error("Errore nell'invio email:", emailErr);
    }
    
    res.status(200).json({ message: 'organizzatore verificato con successo ed email inviata', user });
  } catch (error) {
    res.status(500).json({ message: 'Errore durante la verifica dell\'organizzatore', error: error.message });
  }
};

// Ottenere gli organizzatori non verificati
exports.getPendingOrganizers = async (req, res) => {
  try {
    const organizers = await User.find({ role: 'organizer', verified: false }).select('-password');
    res.status(200).json(organizers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Errore durante il recupero degli organizzatori', error: error.message });
  }
};

// Login utente
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });


    console.log("Utente trovatdo:", user);
    if (!user) {
      return res.status(401).json({ message: 'Credenziali non valide user' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenziali non valide' });
    }

    // Blocca il login degli organizzatori non verificati
    if (user.role === 'organizer' && !user.verified) {
      return res.status(403).json({ message: 'Il tuo account è in attesa di verifica. Contatta l\'amministratore.' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    res.status(200).json({ token, role: user.role, name: user.companyName || user.name });
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

    const prefs = await LocationPreference.find({ user: user._id }).select('location');
    const preferredLocations = prefs.map(p => p.location.toString());

    res.status(200).json({ ...user.toObject(), preferredLocations });
  } catch (error) {
    res.status(500).json({ message: 'Errore durante il recupero del profilo', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      name,
      email,
      address,
      birthDate,
      lat,
      lon,
      companyName,
      partitaIva,
      newPassword,
      confirmPassword
    } = req.body;

    const updates = {};

    // Aggiungi solo i campi effettivamente forniti
    if (name?.trim()) updates.name = name.trim();
    if (email?.trim()) updates.email = email.trim();
    if (address?.trim()) updates.address = address.trim();
    if (birthDate?.trim()) updates.birthDate = new Date(birthDate);
    if (lat !== undefined && lat !== null) updates.lat = lat;
    if (lon !== undefined && lon !== null) updates.lon = lon;
    if (companyName?.trim()) updates.companyName = companyName.trim();
    if (partitaIva?.trim()) updates.partitaIva = partitaIva.trim();

    // Gestione password (se presente)
    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Le nuove password non coincidono' });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ message: 'La password deve contenere almeno 8 caratteri' });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updates.password = hashedPassword;
    }

    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    res.status(200).json({ message: 'Profilo aggiornato con successo', user });
  } catch (error) {
    console.error("Errore durante l'aggiornamento del profilo:", error);
    res.status(500).json({ message: 'Errore interno del server', error: error.message });
  }
};



exports.getAllOrganizersWithLocations = async (req, res) => {
  try {
    const organizers = await User.find({ role: 'organizer' }).select('-password');

    const result = await Promise.all(organizers.map(async (org) => {
      const locations = await Location.find({ organizer: org._id }).select('name address category maxSeats openingTime closingTime enabled');
      return {
        ...org.toObject(),
        locations
      };
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Errore durante il recupero degli organizzatori', error: error.message });
  }
};


// Disabilita un organizer (setta verified a false)
exports.disableOrganizer = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);

    if (!user || user.role !== 'organizer') {
      return res.status(404).json({ message: 'Organizzatore non trovato' });
    }

    user.verified = false;
    await user.save();

    await Event.deleteMany({ organizer: userId });

    res.status(200).json({ message: 'Organizzatore disabilitato con successo' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Errore durante la disabilitazione dell\'organizzatore', error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email mancante nel body' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    await sendPasswordResetEmail(email, token);
    res.status(200).json({ message: 'Email per il reset inviata' });

  } catch (error) {
    console.error("Errore nel reset:", error);
    res.status(500).json({ message: 'Errore nel reset password', error: error.message });
  }
};


exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword, confirmPassword } = req.body;

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({ message: 'Token non valido o scaduto' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'Le password non coincidono' });
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({ message: 'Password reimpostata con successo' });
};

exports.initGuestSession = async (req, res) => {
  try {
    const existingGuestId = req.body.guestId;

    if (existingGuestId && typeof existingGuestId === 'string' && existingGuestId.length > 10) {
      return res.status(200).json({ guestId: existingGuestId });
    }

    const newGuestId = uuidv4();
    return res.status(200).json({ guestId: newGuestId });
  } catch (error) {
    console.error('Errore nella generazione guestId:', error);
    res.status(500).json({ message: 'Errore nella creazione guestId', error: error.message });
  }
};
