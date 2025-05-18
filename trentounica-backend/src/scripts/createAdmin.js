// src/scripts/createAdmin.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/userModel');
const bcrypt = require('bcrypt');

const createAdmin = async () => {
  try {
    console.log("Connessione al database...");
    console.log(process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connesso al database");

    // Rimuovi l'admin esistente (opzionale)
    const deleted = await User.deleteOne({ role: 'admin' });
    console.log("Admin eliminato:", deleted);

    // Crea il nuovo admin
    const password = process.env.ADMIN_PASSWORD || "Password123!";
    console.log("Password fornita:", password);

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Password hashata:", hashedPassword);

    const admin = new User({
      name: "Admin",
      email: process.env.ADMIN_EMAIL || "admin@admin.com",
      password: hashedPassword,  // Assicurati che sia hashata
      role: "admin",
      verified: true
    });

    await admin.save();
    console.log("Admin creato con successo!");
  } catch (error) {
    console.error("Errore durante la creazione dell'admin:", error);
  } finally {
    mongoose.connection.close();
    console.log("Connessione chiusa");
  }
};

createAdmin();
