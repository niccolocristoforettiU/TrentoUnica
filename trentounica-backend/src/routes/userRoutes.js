// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorizeRole } = require('../middlewares/authMiddleware');

// Rotta di registrazione
router.post('/register', userController.register);

// Rotta per verificare gli organizzatori
router.put('/verify/:userId', authenticate, authorizeRole('admin'), userController.verifyOrganizer);

// Rotta di login
router.post('/login', userController.login);

// Rotta per ottenere il profilo utente (Protetta con JWT)
router.get('/profile', authenticate, userController.getProfile);

// Rotta per aggiornare il profilo utente (Protetta con JWT)
router.put('/profile', authenticate, userController.updateProfile);

// Rotte per dashboard specifiche
router.get('/client/dashboard', authenticate, authorizeRole('client'), (req, res) => {
  res.json({ message: 'Benvenuto nel dashboard del cliente!' });
});

router.get('/organizer/dashboard', authenticate, authorizeRole('organizer'), (req, res) => {
  res.json({ message: 'Benvenuto nel dashboard dell\'organizzatore!' });
});

module.exports = router;