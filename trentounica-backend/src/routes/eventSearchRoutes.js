// src/routes/eventSearchRoutes.js

const express = require('express');
const { searchEvents } = require('../controllers/eventSearchController');
const { optionalAuthenticate } = require('../middlewares/authMiddleware');
const router = express.Router();

// Rotta per la ricerca degli eventi
router.get('/', optionalAuthenticate, searchEvents);

module.exports = router;
