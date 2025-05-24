// src/routes/eventSearchRoutes.js

const express = require('express');
const { searchEvents } = require('../controllers/eventSearchController');
const { authenticate } = require('../middlewares/authMiddleware');
const router = express.Router();

// Rotta per la ricerca degli eventi
router.get('/', authenticate, searchEvents);

module.exports = router;
