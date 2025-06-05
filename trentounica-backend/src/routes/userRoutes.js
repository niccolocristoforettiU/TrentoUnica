// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const locationController = require('../controllers/locationController');
const { authenticate, authorizeRole } = require('../middlewares/authMiddleware');

// Rotta di registrazione
router.post('/register', userController.register);

// Rotta per ottenere tutti gli organizer con le location (solo admin)
router.get('/organizers/all', authenticate, authorizeRole('admin'), userController.getAllOrganizersWithLocations);

// Rotta per disabilitare un organizer (solo admin)
router.put('/disable/:userId', authenticate, authorizeRole('admin'), userController.disableOrganizer);

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

// Rotta per verificare un organizzatore (solo admin)
router.put('/verify/:userId', authenticate, authorizeRole('admin'), userController.verifyOrganizer);

// Rotta per ottenere gli organizzatori non verificati (solo admin)
router.get('/organizers/pending', authenticate, authorizeRole('admin'), userController.getPendingOrganizers);

router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password/:token', userController.resetPassword);

// Rotta per inizializzare una sessione guest
router.post('/guest/init', userController.initGuestSession);


module.exports = router;