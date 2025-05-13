// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorizeRole } = require('../middlewares/authMiddleware');

// Rotta di registrazione
router.post('/register', userController.register);

// Rotta di login
router.post('/login', userController.login);

// Rotta per ottenere il profilo utente (Protetta con JWT)
router.get('/profile', authenticate, userController.getProfile);

// Rotta per aggiornare il profilo utente (Protetta con JWT)
router.put('/profile', authenticate, userController.updateProfile);

module.exports = router;