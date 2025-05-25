// src/scripts/createOrganizzatoreTrasporti.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/userModel');
const bcrypt = require('bcrypt');

const createOrganizzatoreTrasporti = async () => {
  try {
    console.log("Connessione al database...");
    console.log(process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connesso al database");

    // Rimuovi l'admin esistente (opzionale)
    const deleted = await User.deleteOne({ role: 'trasporti' });
    console.log("Organizzatore trasporti eliminato:", deleted);

    // Crea il nuovo Organizzatore trasporti
    const password = process.env.TRASPORTI_PASSWORD || "Password123!";
    console.log("Password fornita:", password);

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Password hashata:", hashedPassword);

    const admin = new User({
      name: "Trasporti",
      email: process.env.ADMIN_EMAIL || "trasporti@trasporti.com",
      password: hashedPassword,  // Assicurati che sia hashata
      role: "trasporti",
      verified: true
    });

    await admin.save();
    console.log("Organizzatore trasporti creato con successo!");
  } catch (error) {
    console.error("Errore durante la creazione dell'organizzatore trasporti:", error);
  } finally {
    mongoose.connection.close();
    console.log("Connessione chiusa");
  }
};

createOrganizzatoreTrasporti();
