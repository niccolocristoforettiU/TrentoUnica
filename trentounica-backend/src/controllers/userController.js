// src/controllers/userController.js
const User = require('../models/userModel');
const Location = require('../models/locationModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// src/controllers/userController.js


exports.register = async (req, res) => {
  try {
    const {
      name, email, password, ripetiPassword, role,
      companyName, address, age, partitaIva, locations,
      lat, lon // 👈 aggiunti per il client
    } = req.body;

    if (password !== ripetiPassword) {
      return res.status(400).json({ message: 'Le password non coincidono' });
    }

    if (role === 'client' && (!address || !age || lat == null || lon == null)) {
      return res.status(400).json({ message: 'Indirizzo, età e coordinate sono obbligatorie per i clienti.' });
    }

    if (role === 'organizer' && (!partitaIva || !locations || !Array.isArray(locations))) {
      return res.status(400).json({ message: 'Partita IVA e location sono obbligatorie per gli organizzatori.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email già registrata' });
    }

    // ✅ Creazione utente (aggiunti lat/lon per client)
    const user = new User({
      name: role === 'client' ? name : undefined,
      email,
      password,
      role,
      address: role === 'client' ? address : undefined,
      age: role === 'client' ? age : undefined,
      lat: role === 'client' ? lat : undefined,
      lon: role === 'client' ? lon : undefined,
      companyName: role === 'organizer' ? companyName : undefined,
      partitaIva: role === 'organizer' ? partitaIva : undefined,
      verified: role === 'client'
    });

    await user.save();

    // ✅ Gestione location per organizer
    if (role === 'organizer' && Array.isArray(locations) && locations.length > 0) {
      const validLocations = [];

      for (const location of locations) {
        const {
          name, address, openingTime, closingTime,
          maxSeats, category, lat, lon // 👈 aggiunti lat/lon per location
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

        // ✅ Crea nuova location con lat/lon
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

    res.status(200).json({ message: 'organizzatore verificato con successo', user });
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