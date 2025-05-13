// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Esempio di rotta
router.get('/', (req, res) => res.send('User Route Attiva!'));

module.exports = router;